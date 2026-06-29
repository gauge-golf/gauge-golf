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
 * A coaching summary — written to be read in under 15 seconds. Answers the only
 * question that matters at the end of a session: "Did I get better today?"
 */
export type CoachReport = {
  practiceScore: number; // 0–100 overall session quality
  improved: string;      // what got better today (or the clearest strength shown)
  needsWork: string;     // the single biggest thing holding the player back
  nextFocus: string;     // one concrete focus for the next session
};

export type CoachReportState =
  | { ok: true; report: CoachReport }
  | { ok: false; message: string };

/** Concise pre-session coaching line for one club in today's plan. */
export type AdaptiveClubGuide = {
  clubKey: string;
  balls: number;
  goal: string;
  focus: string;
  avoid: string;
};

/** Pre-training brief shown before "Start Training" for returning users. */
export type AdaptiveCoachingBrief = {
  objective: string;
  drills: string[];
  successCriteria: string;
  focusNote: string;
  clubGuides: AdaptiveClubGuide[];
};

/** AI adaptive plan response state (or fallback to local plan). */
export type AdaptivePlanState =
  | { ok: true; plan: Record<string, number>; coaching: AdaptiveCoachingBrief }
  | { ok: false; fallback: true; message: string };

/** Self-assessment stored after every completed session. */
export type SessionFeeling = "weak" | "normal" | "strong" | "very_strong";

/** Per-club stats persisted with a session (club abbreviation -> values). */
export type ClubStatRecord = {
  best: number;   // best distance this session (m)
  center: number; // center-hit percentage
  shots: number;
  avg?: number;   // average distance this session (m)
  stdDev?: number; // within-session shot distance std deviation (m)
};

/** Aggregated per-club profile built silently across all sessions (Yardage Book). */
export type ClubProfileRecord = {
  clubKey: string;    // club abbreviation, e.g. "7I", "DR"
  avgDistance: number;  // m, weighted rolling average
  reliableDist: number; // m, conservative carry (avg minus spread)
  personalBest: number; // m, all-time best
  accuracy: number;     // %, weighted center-hit average
  dispersion: number;   // m, average within-session std deviation
  sessionCount: number;
  lastUpdated: string;  // ISO timestamp
};

/**
 * One historical data point for a single club, captured from one session.
 * The chronological series of these is the time-series foundation for the
 * future digital Yardage Book (distance/accuracy/dispersion trends over time).
 */
export type ClubTrendPoint = {
  date: string;         // ISO timestamp of the session
  avgDistance: number;  // m
  bestDistance: number; // m
  accuracy: number;     // %, center-hit rate that session
  dispersion: number;   // m, within-session shot std deviation
  shots: number;
};

/** A club's full historical trend (oldest -> newest), powering future trends. */
export type ClubTrend = {
  clubKey: string;          // club abbreviation, e.g. "7I", "DR"
  points: ClubTrendPoint[]; // chronological, oldest first
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
