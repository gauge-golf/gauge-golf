"use server";

import { headers } from "next/headers";
import { sql } from "@/lib/db";
import type { CoachReportPayload, CoachReportState } from "@/lib/coach";

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
 * Input: plan + shots + stats.
 * Output: report with strongest/weakest club, miss pattern, recommendations, next plan.
 */
export async function analyzeSession(
  payload: CoachReportPayload
): Promise<CoachReportState> {
  try {
    const systemPrompt = `You are a professional golf coach analyzing a practice session.
Return ONLY valid JSON in this exact format:
{
  "strongestClub": "SW",
  "weakestClub": "DR",
  "missPattern": "Consistent right miss on longer clubs",
  "recommendations": [
    "First recommendation",
    "Second recommendation", 
    "Third recommendation"
  ],
  "nextSessionPlan": {
    "warmup": 10,
    "sw": 5,
    "pw": 5,
    "i9": 10,
    "i8": 10,
    "i7": 15,
    "i6": 15,
    "i5": 10,
    "driver": 20
  }
}

Analyze the statistics and provide actionable insights. Next session plan should focus on weaknesses.`;

    const userPrompt = `Session Data:
${JSON.stringify(payload, null, 2)}

Analyze and return the report.`;

    const response = await callOpenAI(systemPrompt, userPrompt);
    const report = JSON.parse(response.trim());

    return { ok: true, report };
  } catch (err) {
    console.error("analyzeSession() failed:", err);
    return { ok: false, message: "Failed to analyze session. Try again." };
  }
}
