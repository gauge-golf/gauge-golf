"use server";

import { headers, cookies } from "next/headers";
import { Resend } from "resend";
import { sql } from "@/lib/db";
import type {
  CoachReportPayload,
  CoachReportState,
  AdaptivePlanState,
  AdaptiveClubGuide,
  SaveSessionInput,
  SessionFeeling,
  CoachProgress,
  SessionHistoryItem,
  ClubProfileRecord,
  ClubStatRecord,
} from "@/lib/coach";
import type { AuthUser, PlayerGoal } from "@/lib/auth";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  OTP_TTL_MS,
  signSession,
  verifySession,
  hashCode,
  generateOtp,
  generateUserId,
  isValidEmail,
} from "@/lib/auth";

export type ReserveState = { ok: boolean; message: string };

const required = (v: FormDataEntryValue | null) =>
  typeof v === "string" && v.trim().length > 0 ? v.trim() : "";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function reserve(_prev: ReserveState, fd: FormData): Promise<ReserveState> {
  const name = required(fd.get("name"));
  const email = required(fd.get("email")).toLowerCase();
  const country = required(fd.get("country"));
  const state = required(fd.get("state")) || null;
  const hand = required(fd.get("hand")) || null;
  const gloveSize = required(fd.get("glove_size")) || null;
  const social = required(fd.get("social")) || null;
  const handicap = required(fd.get("handicap")) || null;
  const message = required(fd.get("message")) || null;

  if (!name || !email || !country) {
    return { ok: false, message: "Please fill in name, email and country." };
  }
  if (!emailRe.test(email)) {
    return { ok: false, message: "That email doesn't look right." };
  }
  if (name.length > 120 || email.length > 200 || (message?.length ?? 0) > 2000) {
    return { ok: false, message: "Some fields are too long." };
  }

  const h = await headers();
  const userAgent = h.get("user-agent") ?? null;
  const referer = h.get("referer") ?? null;

  try {
    await sql`
      insert into leads (name, email, country, state, hand, glove_size, social, handicap, message, user_agent, referer)
      values (${name}, ${email}, ${country}, ${state}, ${hand}, ${gloveSize}, ${social}, ${handicap}, ${message}, ${userAgent}, ${referer})
      on conflict (lower(email)) do update set
        name = excluded.name,
        country = excluded.country,
        state = excluded.state,
        hand = excluded.hand,
        glove_size = excluded.glove_size,
        social = excluded.social,
        handicap = excluded.handicap,
        message = excluded.message
    `;
    return { ok: true, message: "You're on the list. Konstantin will reply personally." };
  } catch (err) {
    console.error("reserve() failed:", err);
    return { ok: false, message: "Something broke on our side. Try again in a moment." };
  }
}

/* ───────── Coach AI (OpenAI) ───────── */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * AI Adaptive Plan — personalizes the ball distribution for RETURNING,
 * signed-in users based on their previous session results.
 *
 * Cost control: only runs for verified users (userId read from the signed
 * cookie) who already have history. First-time / anonymous players fall back
 * to the client's hardcoded adaptive plan.
 *
 * The client supplies the eligible club keys + total balls (single source of
 * truth); the AI only redistributes those balls and returns a short rationale.
 */
export async function generateAdaptivePlan(input: {
  practiceType: string;
  goal?: string; // miss type / handicap / etc. (raw option value as string)
  totalBalls: number;
  clubs: string[]; // eligible club keys (e.g. ["sw","pw","i7"])
}): Promise<AdaptivePlanState> {
  try {
    const userId = await currentUserId();
    if (!userId) {
      return { ok: false, fallback: true, message: "Sign in for AI plans." };
    }
    if (!input.clubs.length) {
      return { ok: false, fallback: true, message: "No clubs selected." };
    }

    // Player's profile goal (set once at registration) — steers the plan.
    const profile = await sql`
      select goal, target_handicap from users where id = ${userId} limit 1
    `;
    const playerGoal = (profile[0]?.goal as string | null) ?? null;
    const targetHandicap = (profile[0]?.target_handicap as number | null) ?? null;

    // Pull the last few sessions (most recent first) for this user.
    const rows = await sql`
      select practice_type, practice_score, primary_limitation, next_goal,
             club_stats, created_at
      from coach_sessions
      where user_id = ${userId}
      order by created_at desc
      limit 5
    `;

    // No history yet → let the client use its hardcoded adaptive plan.
    if (!rows.length) {
      return { ok: false, fallback: true, message: "No history yet." };
    }

    const history = rows.map((r) => ({
      practiceType: r.practice_type,
      score: Number(r.practice_score) || null,
      limitation: r.primary_limitation,
      nextGoal: r.next_goal,
      clubStats: r.club_stats ?? {},
      date: r.created_at,
    }));

    // Fetch the player's accumulated yardage book (one row per club).
    const profileRows = await sql`
      select club_key, avg_distance, reliable_dist, personal_best, accuracy, dispersion, session_count
      from club_profiles
      where user_id = ${userId}
      order by last_updated_at desc
    `;
    const yardageBook = profileRows.map((r) => ({
      club: r.club_key,
      avg: Number(r.avg_distance) || null,
      reliable: Number(r.reliable_dist) || null,
      best: Number(r.personal_best) || null,
      accuracy: Number(r.accuracy) || null,
      dispersion: Number(r.dispersion) || null,
      sessions: Number(r.session_count) || 0,
    }));
    const yardageBookLine = yardageBook.length
      ? `\nPlayer's Yardage Book (aggregated from all sessions — avg/reliable/best in metres):\n${JSON.stringify(yardageBook, null, 2)}`
      : "";

    const systemPrompt = `You are an elite golf coach building the NEXT practice plan for a returning player, using their recent session history.

You are given:
- The eligible club keys for this session (use ONLY these).
- The total number of balls to distribute (the sum MUST equal this exactly).
- The player's recent sessions: scores, the ONE limitation you previously identified, the goal you set, and per-club stats (best distance, center-hit %, shots).
- The player's Yardage Book (when available): per-club averages built from ALL sessions. Use avg for realistic targets, reliable for conservative goals, accuracy and dispersion to identify which clubs need the most work.

Return ONLY valid JSON in this exact shape:
{
  "plan": { "<clubKey>": <ballsInt>, ... },
  "coaching": {
    "objective": "One short sentence with today's objective",
    "focusNote": "One short sentence telling the player what this plan targets and why, referencing recent sessions",
    "drills": ["Drill 1", "Drill 2", "Drill 3"],
    "successCriteria": "One short measurable line for what success looks like today",
    "clubGuides": [
      {
        "clubKey": "pw",
        "balls": 10,
        "goal": "Land at least 7 shots in the 90-95 yard window",
        "focus": "Maintain smooth tempo",
        "avoid": "Decelerating through impact"
      }
    ]
  }
}

RULES:
- Keys in "plan" MUST be a subset of the provided eligible club keys. Never invent clubs.
- The integer ball counts MUST sum to EXACTLY the provided total.
- Allocate MORE balls to clubs/areas tied to the player's biggest limitation and lowest center-hit %, and FEWER to clubs they've already mastered.
- Keep at least a few balls on strong clubs to maintain feel.
- objective, focusNote, successCriteria: concise and readable in seconds.
- drills: return 2 or 3 practical drills max.
- clubGuides: include 1 guide per club in the final plan. balls should match that club's plan count.
- clubGuides.goal/focus/avoid should be practical, concise, and specific.
- When the Yardage Book is provided, use reliable_dist (not personal best) to set realistic distance goals in clubGuides.
- Clubs with low accuracy (<60%) or high dispersion (>15m) are priority targets for extra reps.
- Never mention clubs outside eligible keys.
- Keep wording short enough that the full brief is skimmable in under 20 seconds.`;

    const goalLine = playerGoal
      ? `Player's PRIMARY goal: ${playerGoal}${
          targetHandicap ? ` (target handicap ${targetHandicap})` : ""
        }. Weight the plan toward this goal.`
      : "Player has not set a primary goal.";

    const userPrompt = `Practice type: ${input.practiceType}
Session context: ${input.goal ?? "general improvement"}
${goalLine}
Eligible club keys: ${input.clubs.join(", ")}
Total balls to distribute (sum must equal this): ${input.totalBalls}

Recent sessions (most recent first):
${JSON.stringify(history, null, 2)}${yardageBookLine}

Build the adaptive plan.`;

    const response = await callOpenAI(systemPrompt, userPrompt);
    const parsed = JSON.parse(response.trim()) as {
      plan?: Record<string, number>;
      coaching?: {
        objective?: string;
        focusNote?: string;
        drills?: string[];
        successCriteria?: string;
        clubGuides?: AdaptiveClubGuide[];
      };
    };

    const raw = parsed.plan ?? {};
    // Sanitize: keep only eligible clubs, coerce to non-negative ints.
    const allowed = new Set(input.clubs);
    const clean: Record<string, number> = {};
    for (const [key, val] of Object.entries(raw)) {
      if (!allowed.has(key)) continue;
      const n = Math.max(0, Math.round(Number(val) || 0));
      if (n > 0) clean[key] = n;
    }

    // If the model returned nothing usable, fall back.
    const keys = Object.keys(clean);
    if (!keys.length) {
      return { ok: false, fallback: true, message: "Could not build plan." };
    }

    // Reconcile rounding so the totals match exactly.
    let sum = keys.reduce((acc, k) => acc + clean[k], 0);
    let i = 0;
    while (sum !== input.totalBalls && keys.length) {
      const k = keys[i % keys.length];
      if (sum < input.totalBalls) {
        clean[k] += 1;
        sum += 1;
      } else if (clean[k] > 1) {
        clean[k] -= 1;
        sum -= 1;
      }
      i += 1;
      // Safety valve to avoid infinite loops.
      if (i > input.totalBalls * 4 + 50) break;
    }

    const coaching = parsed.coaching ?? {};
    const objective =
      typeof coaching.objective === "string" && coaching.objective.trim()
        ? coaching.objective.trim()
        : "Build cleaner contact and tighter control on your key clubs.";
    const focusNote =
      typeof coaching.focusNote === "string" && coaching.focusNote.trim()
        ? coaching.focusNote.trim()
        : "Tuned to your recent sessions so your weaker clubs get more quality reps.";
    const successCriteria =
      typeof coaching.successCriteria === "string" && coaching.successCriteria.trim()
        ? coaching.successCriteria.trim()
        : "Complete every club block with committed tempo and centered strike.";

    const drills = Array.isArray(coaching.drills)
      ? coaching.drills
          .map((d) => (typeof d === "string" ? d.trim() : ""))
          .filter(Boolean)
          .slice(0, 3)
      : [];
    const safeDrills = drills.length
      ? drills
      : [
          "Pre-shot: pick a landing window before every ball.",
          "Tempo ladder: same smooth count on backswing and through-swing.",
        ];

    const inputGuides = Array.isArray(coaching.clubGuides) ? coaching.clubGuides : [];
    const byKey = new Map<string, AdaptiveClubGuide>();
    for (const guide of inputGuides) {
      if (!guide || !allowed.has(guide.clubKey)) continue;
      byKey.set(guide.clubKey, {
        clubKey: guide.clubKey,
        balls: clean[guide.clubKey] ?? Math.max(1, Math.round(Number(guide.balls) || 0)),
        goal:
          typeof guide.goal === "string" && guide.goal.trim()
            ? guide.goal.trim()
            : "Deliver consistent strikes to the planned target window.",
        focus:
          typeof guide.focus === "string" && guide.focus.trim()
            ? guide.focus.trim()
            : "Balanced tempo and centered contact.",
        avoid:
          typeof guide.avoid === "string" && guide.avoid.trim()
            ? guide.avoid.trim()
            : "Rushing transition from backswing.",
      });
    }

    const clubGuides: AdaptiveClubGuide[] = keys.map((clubKey) => {
      const existing = byKey.get(clubKey);
      if (existing) return { ...existing, balls: clean[clubKey] };
      return {
        clubKey,
        balls: clean[clubKey],
        goal: "Deliver consistent strikes to the planned target window.",
        focus: "Balanced tempo and centered contact.",
        avoid: "Rushing transition from backswing.",
      };
    });

    return {
      ok: true,
      plan: clean,
      coaching: {
        objective,
        focusNote,
        drills: safeDrills,
        successCriteria,
        clubGuides,
      },
    };
  } catch (err) {
    console.error("generateAdaptivePlan() failed:", err);
    return { ok: false, fallback: true, message: "Plan generation failed." };
  }
}

/**
 * AI Call #2 — Analyze session results AFTER completion.
 * Produces a personal-coach style report: a practice score, the single biggest
 * thing holding the player back, coaching principles, and one measurable goal.
 */
export async function analyzeSession(
  payload: CoachReportPayload
): Promise<CoachReportState> {
  try {
    // If signed in, align feedback with the player's profile goal.
    let goalLine = "";
    const userId = await currentUserId();
    if (userId) {
      const profile = await sql`
        select goal, target_handicap from users where id = ${userId} limit 1
      `;
      const goal = (profile[0]?.goal as string | null) ?? null;
      const th = (profile[0]?.target_handicap as number | null) ?? null;
      if (goal) {
        goalLine = `\nThe player's PRIMARY goal is: ${goal}${
          th ? ` (target handicap ${th})` : ""
        }. Make the nextGoal and feedback push them toward this.`;
      }
    }

    const systemPrompt = `You are an elite golf coach giving a player personal feedback after a driving-range session. You speak like a real coach drawing on classic golf instruction (Hogan, Penick, Pelz) — focused on cause and effect, not numbers.

Return ONLY valid JSON in this exact shape:
{
  "practiceScore": 0-100,
  "primaryLimitation": {
    "title": "Short name of the ONE biggest limiter",
    "explanation": "2-3 sentences explaining WHY it is happening and how it costs strokes."
  },
  "coachingPrinciples": [
    "3 to 5 coaching principles"
  ],
  "nextGoal": "One specific, measurable objective for the next session."
}

RULES:
- practiceScore: an honest 0-100 reflecting consistency, strike and control this session.
- primaryLimitation: identify exactly ONE root issue (e.g. directional control with longer clubs, open clubface at impact, inconsistent strike, poor distance control, tempo inconsistency, over-swinging). Explain the WHY, never just restate stats.
- coachingPrinciples: 3-5 short, memorable principles like a great coach would say. Do NOT mention any percentages, numbers, or raw statistics here. Make them feel personal to this session.
- nextGoal: exactly ONE measurable goal, ideally using a club from the player's bag.
- The player's bag lists the ONLY clubs they own — never reference a club they don't have.
- Tone: encouraging, direct, insightful. The player should think "I learned something useful", not "another stats report".`;

    const w = payload.weather;
    const weatherLine = w
      ? `\nConditions during the session: ${w.tempC}°C (feels ${w.apparentC}°C), wind ${w.windKmh} km/h ${w.windDir}, precipitation ${w.precipMm} mm, humidity ${w.humidityPct}%, pressure ${w.pressureHpa} hPa, UV ${w.uvIndex} (${w.uvLabel}). Factor these in: head/tail/cross wind, cold or thin/dense air and rain change carry and accuracy — reference them when they plausibly explain shorter/longer or offline shots.`
      : "";

    const userPrompt = `Session Data:
${JSON.stringify(payload, null, 2)}

The player's bag contains only these clubs: ${(payload.bag ?? []).join(", ")}.
They hit ${payload.totalBalls} balls over ${Math.round((payload.durationSecs ?? 0) / 60)} minutes.${goalLine}${weatherLine}
Give your coaching report.`;

    const response = await callOpenAI(systemPrompt, userPrompt);
    const report = JSON.parse(response.trim());

    return { ok: true, report };
  } catch (err) {
    console.error("analyzeSession() failed:", err);
    return { ok: false, message: "Failed to analyze session. Try again." };
  }
}

/**
 * Persist a completed session to Neon and return its id.
 * Stores per-club stats (for personal records) and an anonymous per-device id
 * (for streaks/totals). The self-assessment is added later via updateSessionFeeling.
 */
export async function saveSession(
  input: SaveSessionInput
): Promise<{ ok: boolean; id?: number }> {
  try {
    const h = await headers();
    const userAgent = h.get("user-agent") ?? null;
    const referer = h.get("referer") ?? null;
    const userId = await currentUserId(); // attach to the signed-in user, if any

    const rows = await sql`
      insert into coach_sessions
        (client_id, user_id, practice_type, total_balls, duration_secs, clubs_practiced,
         practice_score, primary_limitation, next_goal, club_stats, user_agent, referer)
      values
        (${input.clientId}, ${userId}, ${input.practiceType}, ${input.totalBalls}, ${input.durationSecs},
         ${input.clubsPracticed}, ${input.practiceScore}, ${input.primaryLimitation},
         ${input.nextGoal}, ${JSON.stringify(input.clubStats)}, ${userAgent}, ${referer})
      returning id
    `;

    // Silently update the player's per-club yardage profiles in the background.
    await upsertClubProfiles(input.clubStats, userId, input.clientId);

    return { ok: true, id: Number(rows[0]?.id) };
  } catch (err) {
    console.error("saveSession() failed:", err);
    return { ok: false };
  }
}

/**
 * Upsert the player's per-club yardage profile from a single session's stats.
 * Uses a weighted running average so every session improves the accuracy of the data.
 * profile_key = "user:{id}:{club}" (signed-in) | "anon:{clientId}:{club}" (anonymous).
 */
async function upsertClubProfiles(
  clubStats: Record<string, ClubStatRecord>,
  userId: string | null,
  clientId: string
): Promise<void> {
  const entries = Object.entries(clubStats).filter(([, s]) => s.shots > 0 && (s.best > 0 || (s.avg ?? 0) > 0));
  if (!entries.length) return;

  const existing = userId
    ? await sql`
        select profile_key, avg_distance, personal_best, accuracy, dispersion, session_count, total_shots
        from club_profiles where user_id = ${userId}
      `
    : await sql`
        select profile_key, avg_distance, personal_best, accuracy, dispersion, session_count, total_shots
        from club_profiles where client_id = ${clientId} and user_id is null
      `;

  const prevMap = new Map(existing.map((r) => [r.profile_key as string, r]));

  for (const [clubKey, stat] of entries) {
    const profileKey = userId
      ? `user:${userId}:${clubKey}`
      : `anon:${clientId}:${clubKey}`;
    const prev = prevMap.get(profileKey);

    const newAvg = stat.avg ?? stat.best;
    const newBest = stat.best;
    const newAccuracy = stat.center;
    const newStdDev = stat.stdDev ?? 0;
    const newShots = stat.shots;

    let updAvg: number, updBest: number, updAccuracy: number, updDispersion: number;
    let updSessions: number, updTotalShots: number;

    if (prev) {
      const oldShots = Number(prev.total_shots) || 0;
      const oldSessions = Number(prev.session_count) || 1;
      const combined = oldShots + newShots;
      updAvg =
        combined > 0
          ? Math.round(
              (Number(prev.avg_distance) * oldShots + newAvg * newShots) / combined
            )
          : newAvg;
      updBest = Math.max(Number(prev.personal_best) || 0, newBest);
      updAccuracy =
        combined > 0
          ? Math.round(
              (Number(prev.accuracy) * oldShots + newAccuracy * newShots) / combined
            )
          : newAccuracy;
      updDispersion = Math.round(
        (Number(prev.dispersion) * oldSessions + newStdDev) / (oldSessions + 1)
      );
      updSessions = oldSessions + 1;
      updTotalShots = oldShots + newShots;
    } else {
      updAvg = newAvg;
      updBest = newBest;
      updAccuracy = newAccuracy;
      updDispersion = newStdDev;
      updSessions = 1;
      updTotalShots = newShots;
    }

    // reliable_dist = avg minus whichever is larger: actual spread or 8% buffer.
    const updReliable = Math.max(
      5,
      updAvg - Math.max(updDispersion, Math.round(updAvg * 0.08))
    );

    await sql`
      insert into club_profiles
        (profile_key, user_id, client_id, club_key,
         avg_distance, reliable_dist, personal_best, accuracy, dispersion,
         session_count, total_shots, last_updated_at)
      values
        (${profileKey}, ${userId}, ${clientId}, ${clubKey},
         ${updAvg}, ${updReliable}, ${updBest}, ${updAccuracy}, ${updDispersion},
         ${updSessions}, ${updTotalShots}, now())
      on conflict (profile_key)
      do update set
        avg_distance    = ${updAvg},
        reliable_dist   = ${updReliable},
        personal_best   = ${updBest},
        accuracy        = ${updAccuracy},
        dispersion      = ${updDispersion},
        session_count   = ${updSessions},
        total_shots     = ${updTotalShots},
        last_updated_at = now()
    `;
  }
}

/** Fetch the player's aggregated per-club yardage profiles (Yardage Book data). */
export async function getClubProfiles(
  userId: string
): Promise<ClubProfileRecord[]> {
  try {
    const rows = await sql`
      select club_key, avg_distance, reliable_dist, personal_best,
             accuracy, dispersion, session_count, last_updated_at
      from club_profiles
      where user_id = ${userId}
      order by last_updated_at desc
    `;
    return rows.map((r) => ({
      clubKey: r.club_key as string,
      avgDistance: Number(r.avg_distance) || 0,
      reliableDist: Number(r.reliable_dist) || 0,
      personalBest: Number(r.personal_best) || 0,
      accuracy: Number(r.accuracy) || 0,
      dispersion: Number(r.dispersion) || 0,
      sessionCount: Number(r.session_count) || 0,
      lastUpdated: new Date(r.last_updated_at as string).toISOString(),
    }));
  } catch (err) {
    console.error("getClubProfiles() failed:", err);
    return [];
  }
}

/** Store the user's self-assessment on an existing session row. */
export async function updateSessionFeeling(
  id: number,
  feeling: SessionFeeling
): Promise<{ ok: boolean }> {
  try {
    await sql`update coach_sessions set session_feeling = ${feeling} where id = ${id}`;
    return { ok: true };
  } catch (err) {
    console.error("updateSessionFeeling() failed:", err);
    return { ok: false };
  }
}

/** ISO-ish week index (UTC) used for streak calculation. */
function weekIndex(d: Date): number {
  const days = Math.floor(d.getTime() / 86_400_000);
  // Shift so weeks break on Monday (epoch 1970-01-01 was a Thursday).
  return Math.floor((days + 3) / 7);
}

/**
 * Aggregate cross-session progress. When userId is given, history spans all of
 * the user's devices; otherwise it falls back to the anonymous device clientId.
 * Records exclude the current session so we can flag genuinely NEW personal records.
 */
export async function getCoachProgress(
  clientId: string,
  excludeId?: number,
  userId?: string
): Promise<CoachProgress> {
  const empty: CoachProgress = {
    totalSessions: 0,
    totalBalls: 0,
    streakWeeks: 0,
    recordsByClub: {},
    mostConsistentClub: null,
  };
  if (!clientId && !userId) return empty;

  try {
    const rows = userId
      ? await sql`
          select id, total_balls, club_stats, created_at
          from coach_sessions
          where user_id = ${userId}
        `
      : await sql`
          select id, total_balls, club_stats, created_at
          from coach_sessions
          where client_id = ${clientId}
        `;

    const totalSessions = rows.length;
    const totalBalls = rows.reduce(
      (acc, r) => acc + (Number(r.total_balls) || 0),
      0
    );

    // Streak: consecutive weeks (ending at the most recent active week) with >=1 session.
    const weeks = new Set(rows.map((r) => weekIndex(new Date(r.created_at))));
    let streakWeeks = 0;
    if (weeks.size) {
      let w = Math.max(...weeks);
      while (weeks.has(w)) {
        streakWeeks += 1;
        w -= 1;
      }
    }

    // Personal records (best distance per club) excluding the current session,
    // plus a weighted center-% tally to find the most consistent club all-time.
    const recordsByClub: Record<string, number> = {};
    const centerSum: Record<string, number> = {};
    const centerCount: Record<string, number> = {};
    for (const r of rows) {
      const cs = (r.club_stats ?? {}) as Record<
        string,
        { best?: number; center?: number; shots?: number }
      >;
      for (const [club, v] of Object.entries(cs)) {
        const shots = Number(v?.shots) || 0;
        const center = Number(v?.center) || 0;
        centerSum[club] = (centerSum[club] ?? 0) + center * shots;
        centerCount[club] = (centerCount[club] ?? 0) + shots;
        if (excludeId && Number(r.id) === excludeId) continue;
        const best = Number(v?.best) || 0;
        if (best > (recordsByClub[club] ?? 0)) recordsByClub[club] = best;
      }
    }

    let mostConsistentClub: string | null = null;
    let bestAvg = -1;
    for (const club of Object.keys(centerCount)) {
      if (centerCount[club] < 2) continue;
      const avg = centerSum[club] / centerCount[club];
      if (avg > bestAvg) {
        bestAvg = avg;
        mostConsistentClub = club;
      }
    }

    return { totalSessions, totalBalls, streakWeeks, recordsByClub, mostConsistentClub };
  } catch (err) {
    console.error("getCoachProgress() failed:", err);
    return empty;
  }
}

/**
 * List a player's past sessions (most recent first). Prefers the signed-in
 * user; otherwise falls back to the anonymous device clientId.
 */
export async function getSessionHistory(
  clientId: string,
  userId?: string,
  limit = 50
): Promise<SessionHistoryItem[]> {
  if (!clientId && !userId) return [];
  try {
    const rows = userId
      ? await sql`
          select id, practice_type, total_balls, duration_secs, practice_score,
                 primary_limitation, next_goal, session_feeling, clubs_practiced,
                 club_stats, created_at
          from coach_sessions
          where user_id = ${userId}
          order by created_at desc
          limit ${limit}
        `
      : await sql`
          select id, practice_type, total_balls, duration_secs, practice_score,
                 primary_limitation, next_goal, session_feeling, clubs_practiced,
                 club_stats, created_at
          from coach_sessions
          where client_id = ${clientId}
          order by created_at desc
          limit ${limit}
        `;

    return rows.map((r) => ({
      id: Number(r.id),
      practiceType: (r.practice_type as string | null) ?? null,
      totalBalls: Number(r.total_balls) || 0,
      durationSecs: Number(r.duration_secs) || 0,
      practiceScore: r.practice_score != null ? Number(r.practice_score) : null,
      primaryLimitation: (r.primary_limitation as string | null) ?? null,
      nextGoal: (r.next_goal as string | null) ?? null,
      sessionFeeling: (r.session_feeling as SessionFeeling | null) ?? null,
      clubsPracticed: r.clubs_practiced != null ? Number(r.clubs_practiced) : null,
      clubStats: (r.club_stats ?? {}) as SessionHistoryItem["clubStats"],
      createdAt: new Date(r.created_at as string).toISOString(),
    }));
  } catch (err) {
    console.error("getSessionHistory() failed:", err);
    return [];
  }
}

/* ───── Passwordless auth (email + OTP) ───── */

/** Read + verify the signed session cookie, returning the userId or null. */
async function currentUserId(): Promise<string | null> {
  const c = await cookies();
  return verifySession(c.get(SESSION_COOKIE)?.value);
}

/** Step 1 — email entered. Generate a 6-digit code, store its hash, email it. */
export async function requestOtp(
  emailRaw: string
): Promise<{ ok: boolean; message: string }> {
  const email = emailRaw.trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, message: "Please enter a valid email." };
  }
  try {
    const code = generateOtp();
    const codeHash = hashCode(email, code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await sql`
      insert into otp_codes (email, code_hash, expires_at)
      values (${email}, ${codeHash}, ${expiresAt.toISOString()})
    `;

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM ?? "Gauge Golf <hello@gauge-golf.com>";
    if (!apiKey) {
      console.error("requestOtp: RESEND_API_KEY not set");
      return { ok: false, message: "Email isn't configured yet. Try again later." };
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: `${code} is your Gauge Golf code`,
      html: otpEmailHtml(code),
    });
    if (error) {
      console.error("requestOtp: resend error", error);
      return { ok: false, message: "Couldn't send the code. Try again." };
    }

    return { ok: true, message: "Code sent. Check your inbox." };
  } catch (err) {
    console.error("requestOtp() failed:", err);
    return { ok: false, message: "Something went wrong. Try again." };
  }
}

/** Step 2 — verify the code, find/create the user, link history, set the cookie. */
export async function verifyOtp(
  emailRaw: string,
  code: string,
  clientId?: string
): Promise<{ ok: boolean; message: string; user?: AuthUser; isNew?: boolean }> {
  const email = emailRaw.trim().toLowerCase();
  const cleanCode = code.trim();
  if (!isValidEmail(email) || !/^\d{6}$/.test(cleanCode)) {
    return { ok: false, message: "Enter the 6-digit code we emailed you." };
  }

  try {
    const codeHash = hashCode(email, cleanCode);
    const matches = await sql`
      select id from otp_codes
      where lower(email) = ${email}
        and code_hash = ${codeHash}
        and consumed = false
        and expires_at > now()
      order by created_at desc
      limit 1
    `;
    if (!matches.length) {
      return { ok: false, message: "That code is invalid or expired." };
    }
    await sql`update otp_codes set consumed = true where id = ${matches[0].id}`;

    // Find or create the user.
    const existing = await sql`
      select id, email, display_name, goal, target_handicap
      from users where lower(email) = ${email} limit 1
    `;
    let user: AuthUser;
    let isNew = false;
    if (existing.length) {
      user = {
        id: existing[0].id as string,
        email: existing[0].email as string,
        displayName: (existing[0].display_name as string | null) ?? null,
        goal: (existing[0].goal as PlayerGoal | null) ?? null,
        targetHandicap: (existing[0].target_handicap as number | null) ?? null,
      };
    } else {
      isNew = true;
      // Generate a unique GG-id (retry on the rare collision).
      let id = generateUserId();
      for (let i = 0; i < 5; i++) {
        const clash = await sql`select 1 from users where id = ${id} limit 1`;
        if (!clash.length) break;
        id = generateUserId();
      }
      await sql`insert into users (id, email) values (${id}, ${email})`;
      user = { id, email, displayName: null, goal: null, targetHandicap: null };
    }

    // Link any prior anonymous sessions from this device to the user.
    if (clientId) {
      await sql`
        update coach_sessions set user_id = ${user.id}
        where client_id = ${clientId} and user_id is null
      `;
    }

    // Set the secure, long-lived session cookie (auto sign-in).
    const c = await cookies();
    c.set(SESSION_COOKIE, signSession(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return { ok: true, message: isNew ? "Account created." : "Welcome back.", user, isNew };
  } catch (err) {
    console.error("verifyOtp() failed:", err);
    return { ok: false, message: "Something went wrong. Try again." };
  }
}

/** Return the currently signed-in user (auto sign-in via cookie), or null. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const userId = await currentUserId();
    if (!userId) return null;
    const rows = await sql`
      select id, email, display_name, goal, target_handicap
      from users where id = ${userId} limit 1
    `;
    if (!rows.length) return null;
    return {
      id: rows[0].id as string,
      email: rows[0].email as string,
      displayName: (rows[0].display_name as string | null) ?? null,
      goal: (rows[0].goal as PlayerGoal | null) ?? null,
      targetHandicap: (rows[0].target_handicap as number | null) ?? null,
    };
  } catch (err) {
    console.error("getCurrentUser() failed:", err);
    return null;
  }
}

/** Save the signed-in player's display name. Returns the cleaned name. */
export async function setDisplayName(
  name: string
): Promise<{ ok: boolean; displayName: string | null }> {
  try {
    const userId = await currentUserId();
    if (!userId) return { ok: false, displayName: null };
    const clean = name.trim().slice(0, 40);
    const value = clean.length ? clean : null;
    await sql`update users set display_name = ${value} where id = ${userId}`;
    return { ok: true, displayName: value };
  } catch (err) {
    console.error("setDisplayName() failed:", err);
    return { ok: false, displayName: null };
  }
}

/** Save the signed-in player's profile goal (set once at registration). */
export async function setUserGoal(
  goal: PlayerGoal,
  targetHandicap?: number | null
): Promise<{ ok: boolean }> {
  try {
    const userId = await currentUserId();
    if (!userId) return { ok: false };
    const th =
      typeof targetHandicap === "number" && Number.isFinite(targetHandicap)
        ? Math.round(targetHandicap)
        : null;
    await sql`
      update users set goal = ${goal}, target_handicap = ${th} where id = ${userId}
    `;
    return { ok: true };
  } catch (err) {
    console.error("setUserGoal() failed:", err);
    return { ok: false };
  }
}

/** Clear the session cookie. */
export async function signOut(): Promise<{ ok: boolean }> {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
  return { ok: true };
}

/**
 * Wipe a player's training history for a clean slate. Deletes coach_sessions
 * for the signed-in user (from the cookie) AND/OR the anonymous device id.
 * Useful for testing or when a player wants to start over from zero.
 */
export async function resetMyData(
  clientId?: string
): Promise<{ ok: boolean; deleted: number; message: string }> {
  try {
    const userId = await currentUserId();
    if (!userId && !clientId) {
      return { ok: false, deleted: 0, message: "Nothing to reset." };
    }

    let deleted = 0;
    if (userId) {
      const rows =
        await sql`delete from coach_sessions where user_id = ${userId} returning id`;
      deleted += rows.length;
      await sql`delete from club_profiles where user_id = ${userId}`;
    }
    if (clientId) {
      const rows =
        await sql`delete from coach_sessions where client_id = ${clientId} returning id`;
      deleted += rows.length;
      await sql`delete from club_profiles where client_id = ${clientId} and user_id is null`;
    }

    return { ok: true, deleted, message: `Cleared ${deleted} session(s).` };
  } catch (err) {
    console.error("resetMyData() failed:", err);
    return { ok: false, deleted: 0, message: "Couldn't reset your data." };
  }
}

function otpEmailHtml(code: string): string {
  return `
  <div style="background:#0b0b0c;padding:40px 0;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:420px;margin:0 auto;padding:32px;border:1px solid rgba(255,255,255,0.12);border-radius:18px">
      <div style="color:#f1c04e;font-weight:800;letter-spacing:2px;font-size:18px">GAUGE GOLF</div>
      <p style="color:rgba(255,255,255,0.7);font-size:15px;margin:24px 0 8px">Your sign-in code:</p>
      <div style="color:#ffffff;font-size:40px;font-weight:800;letter-spacing:10px">${code}</div>
      <p style="color:rgba(255,255,255,0.45);font-size:13px;margin-top:24px">
        This code expires in 10 minutes. If you didn't request it, you can ignore this email.
      </p>
    </div>
  </div>`;
}
