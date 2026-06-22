"use server";

import { headers } from "next/headers";
import { sql } from "@/lib/db";
import type {
  CoachReportPayload,
  CoachReportState,
  SaveSessionInput,
  SessionFeeling,
  CoachProgress,
} from "@/lib/coach";

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
 * AI Call #1 — Generate training plan BEFORE session starts.
 * Input: practice type + ball count.
 * Output: club distribution plan (JSON).
 */
export async function generatePlan(
  practiceType: string,
  ballCount: number
): Promise<{ ok: true; plan: Record<string, number> } | { ok: false; message: string }> {
  try {
    const systemPrompt = `You are a professional golf coach. Generate a training plan distribution for a driving range session.
Return ONLY valid JSON in this exact format:
{
  "warmup": 10,
  "sw": 10,
  "pw": 10,
  "i9": 10,
  "i8": 10,
  "i7": 10,
  "i6": 10,
  "i5": 10,
  "driver": 20
}

The total must equal the requested ball count. Adjust proportions based on the practice type.`;

    const userPrompt = `Practice Type: ${practiceType}
Ball Count: ${ballCount}

Generate the plan.`;

    const response = await callOpenAI(systemPrompt, userPrompt);
    const plan = JSON.parse(response.trim());

    return { ok: true, plan };
  } catch (err) {
    console.error("generatePlan() failed:", err);
    return { ok: false, message: "Failed to generate plan. Try again." };
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

    const userPrompt = `Session Data:
${JSON.stringify(payload, null, 2)}

The player's bag contains only these clubs: ${(payload.bag ?? []).join(", ")}.
They hit ${payload.totalBalls} balls over ${Math.round((payload.durationSecs ?? 0) / 60)} minutes.
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

    const rows = await sql`
      insert into coach_sessions
        (client_id, practice_type, total_balls, duration_secs, clubs_practiced,
         practice_score, primary_limitation, next_goal, club_stats, user_agent, referer)
      values
        (${input.clientId}, ${input.practiceType}, ${input.totalBalls}, ${input.durationSecs},
         ${input.clubsPracticed}, ${input.practiceScore}, ${input.primaryLimitation},
         ${input.nextGoal}, ${JSON.stringify(input.clubStats)}, ${userAgent}, ${referer})
      returning id
    `;
    return { ok: true, id: Number(rows[0]?.id) };
  } catch (err) {
    console.error("saveSession() failed:", err);
    return { ok: false };
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
 * Aggregate cross-session progress for one device.
 * Records exclude the current session so we can flag genuinely NEW personal records.
 */
export async function getCoachProgress(
  clientId: string,
  excludeId?: number
): Promise<CoachProgress> {
  const empty: CoachProgress = {
    totalSessions: 0,
    totalBalls: 0,
    streakWeeks: 0,
    recordsByClub: {},
  };
  if (!clientId) return empty;

  try {
    const rows = await sql`
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

    // Personal records (best distance per club) from all sessions EXCEPT the current one.
    const recordsByClub: Record<string, number> = {};
    for (const r of rows) {
      if (excludeId && Number(r.id) === excludeId) continue;
      const cs = (r.club_stats ?? {}) as Record<string, { best?: number }>;
      for (const [club, v] of Object.entries(cs)) {
        const best = Number(v?.best) || 0;
        if (best > (recordsByClub[club] ?? 0)) recordsByClub[club] = best;
      }
    }

    return { totalSessions, totalBalls, streakWeeks, recordsByClub };
  } catch (err) {
    console.error("getCoachProgress() failed:", err);
    return empty;
  }
}
