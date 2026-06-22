// Shared types for the Coach AI report (kept out of "use server" files,
// which may only export async functions).

import type { SessionWeather } from "@/lib/weather";

export type CoachReportPayload = {
  plan: unknown; // session plan (clubs + ball counts)
  results: unknown; // logged shots
  stats: unknown; // computed per-club statistics
  bag: string[]; // clubs the user actually owns (abbreviations)
  totalBalls: number; // shots logged this session
  durationSecs: number; // session length in seconds
  weather?: SessionWeather | null; // conditions at session start (if available)
};

/**
 * A coaching report — written like a personal coach, not a stats dashboard.
 * It explains WHY the session went the way it did and WHAT to focus on next.
 */
export type CoachReport = {
  practiceScore: number; // 0–100 overall session quality
  primaryLimitation: {
    title: string; // the single biggest limiter, e.g. "Open clubface at impact"
    explanation: string; // why it's happening, in plain language
  };
  coachingPrinciples: string[]; // 3–5 coaching-concept tips (no stats)
  nextGoal: string; // one specific, measurable objective
};

export type CoachReportState =
  | { ok: true; report: CoachReport }
  | { ok: false; message: string };

/** Self-assessment stored after every completed session. */
export type SessionFeeling = "weak" | "normal" | "strong" | "very_strong";

/** Per-club stats persisted with a session (club abbreviation -> values). */
export type ClubStatRecord = {
  best: number; // best distance this session (m)
  center: number; // center-hit percentage
  shots: number;
};

export type SaveSessionInput = {
  clientId: string; // anonymous per-device id
  practiceType: string;
  totalBalls: number;
  durationSecs: number;
  clubsPracticed: number;
  practiceScore: number;
  primaryLimitation: string;
  nextGoal: string;
  clubStats: Record<string, ClubStatRecord>;
};

/** Aggregated, cross-session progress for one device or user. */
export type CoachProgress = {
  totalSessions: number;
  totalBalls: number;
  streakWeeks: number;
  /** Best distance ever recorded per club (m), EXCLUDING the current session. */
  recordsByClub: Record<string, number>;
  /** Most consistent club across all history (highest avg center %), or null. */
  mostConsistentClub: string | null;
};

/** One past session, for the history list. */
export type SessionHistoryItem = {
  id: number;
  practiceType: string | null;
  totalBalls: number;
  durationSecs: number;
  practiceScore: number | null;
  primaryLimitation: string | null;
  nextGoal: string | null;
  sessionFeeling: SessionFeeling | null;
  clubsPracticed: number | null;
  clubStats: Record<string, ClubStatRecord>;
  createdAt: string; // ISO timestamp
};
