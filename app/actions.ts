"use server";

import { headers, cookies } from "next/headers";
import { Resend } from "resend";
import { sql } from "@/lib/db";
import type {
  CoachReportPayload,
  CoachReportState,
  SaveSessionInput,
  SessionFeeling,
  CoachProgress,
} from "@/lib/coach";
import type { AuthUser } from "@/lib/auth";
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
    const existing = await sql`select id, email from users where lower(email) = ${email} limit 1`;
    let user: AuthUser;
    let isNew = false;
    if (existing.length) {
      user = { id: existing[0].id as string, email: existing[0].email as string };
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
      user = { id, email };
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
    const rows = await sql`select id, email from users where id = ${userId} limit 1`;
    if (!rows.length) return null;
    return { id: rows[0].id as string, email: rows[0].email as string };
  } catch (err) {
    console.error("getCurrentUser() failed:", err);
    return null;
  }
}

/** Clear the session cookie. */
export async function signOut(): Promise<{ ok: boolean }> {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
  return { ok: true };
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
