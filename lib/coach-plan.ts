// Coach domain logic — pure functions only (no React, no browser, no I/O).
// Training-plan builders, the shot/stat data model, and session statistics.
// Kept framework-free so it's trivially testable and reusable.

import type { SessionFeeling } from "@/lib/coach";

/* ───────── Data model ───────── */

export type PlanStep = {
  key: string;
  label: string;
  club: string;
  target: number;
  balls: number;
};

/** Order + display labels + club abbreviation + target (m) for every plan slot. */
export const STEP_LABELS: {
  key: string;
  label: string;
  club: string;
  target: number;
}[] = [
  { key: "sw", label: "Sand Wedge", club: "SW", target: 60 },
  { key: "pw", label: "Pitching Wedge", club: "PW", target: 90 },
  { key: "i9", label: "9 Iron", club: "9I", target: 110 },
  { key: "i8", label: "8 Iron", club: "8I", target: 125 },
  { key: "i7", label: "7 Iron", club: "7I", target: 140 },
  { key: "i6", label: "6 Iron", club: "6I", target: 155 },
  { key: "i5", label: "5 Iron", club: "5I", target: 170 },
  { key: "driver", label: "Driver", club: "DR", target: 230 },
];

export const OUT = "Out" as const;
export type DistanceResult = number | typeof OUT;

/* ───────── Units (display only — storage is always metres) ───────── */

export type Unit = "yd" | "m";
export const DEFAULT_UNIT: Unit = "yd";
const M_PER_YD = 0.9144;

/** Convert a stored metre value into the player's display unit (rounded). */
export function mToUnit(meters: number, unit: Unit): number {
  return unit === "m" ? Math.round(meters) : Math.round(meters / M_PER_YD);
}

/** Convert a display-unit value back into stored metres (rounded). */
export function unitToM(value: number, unit: Unit): number {
  return unit === "m" ? Math.round(value) : Math.round(value * M_PER_YD);
}

/** Format a stored metre value for display, e.g. "153 yd". */
export function fmtDist(meters: number, unit: Unit): string {
  return `${mToUnit(meters, unit)} ${unit}`;
}

/**
 * Quick distance presets (in the display unit) centred on the club's target.
 * Five chips in 5-unit steps cover the common spread; manual entry handles
 * anything outside the range, so every club supports any realistic distance.
 */
export function distancePresets(targetMeters: number, unit: Unit): number[] {
  const target = mToUnit(targetMeters, unit);
  const center = Math.round(target / 5) * 5;
  return [center - 10, center - 5, center, center + 5, center + 10].filter(
    (d) => d >= 5
  );
}

/** Total balls planned across every step. */
export function totalBalls(plan: PlanStep[]): number {
  return plan.reduce((acc, s) => acc + s.balls, 0);
}

/**
 * Map a 0-based global shot index onto its plan slot. Position is derived from
 * how many shots have been logged, so a player can never accidentally skip a
 * shot and Undo simply removes the last entry. Returns null once the plan is
 * complete.
 */
export function locateShot(
  plan: PlanStep[],
  shotIndex: number
): { stepIndex: number; shotNum: number } | null {
  let acc = 0;
  for (let i = 0; i < plan.length; i++) {
    if (shotIndex < acc + plan[i].balls) {
      return { stepIndex: i, shotNum: shotIndex - acc + 1 };
    }
    acc += plan[i].balls;
  }
  return null;
}

/** Direction options. */
export const DIRECTIONS = ["Left", "Center", "Right"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const DEFAULT_DIRECTION: Direction = "Center";

export type Shot = {
  club: string;
  target: number;
  distance: DistanceResult;
  direction: Direction;
};

/** Selectable clubs for the bag. */
export const BAG_CLUBS = STEP_LABELS;

/** Look up a club's short abbreviation from its plan key. */
export function clubAbbr(key: string): string {
  return STEP_LABELS.find((s) => s.key === key)?.club ?? key.toUpperCase();
}

/** Self-assessment options shown after a session. */
export const FEELINGS: { value: SessionFeeling; label: string }[] = [
  { value: "weak", label: "Weak" },
  { value: "normal", label: "Normal" },
  { value: "strong", label: "Strong" },
  { value: "very_strong", label: "Very Strong" },
];

/* ───────── Adaptive Plan Builders ───────── */

/** Driving Range: distribute balls evenly across bag. */
export function buildDrivingRangePlan(
  ballCount: number,
  bag: string[]
): PlanStep[] {
  const slots = STEP_LABELS.filter((s) => bag.includes(s.key));
  const n = slots.length;
  if (n === 0) return [];

  const base = Math.floor(ballCount / n);
  let remainder = ballCount - base * n;

  return slots.map((s) => {
    let balls = base;
    if (remainder > 0) {
      balls += 1;
      remainder -= 1;
    }
    return { ...s, balls };
  });
}

/** Warm Up: quick reps across bag, prioritize short game. */
export function buildWarmUpPlan(holes: number, bag: string[]): PlanStep[] {
  const slots = STEP_LABELS.filter((s) => bag.includes(s.key));
  if (slots.length === 0) return [];

  const totalBalls = holes === 9 ? 30 : 50;

  // Prioritize short game (wedges/short irons get more reps)
  const shortGame = slots.filter((s) => ["sw", "pw", "i9"].includes(s.key));
  const longGame = slots.filter((s) => !["sw", "pw", "i9"].includes(s.key));

  const plan: PlanStep[] = [];
  let remaining = totalBalls;

  // 60% short game, 40% long game
  const shortBalls = Math.floor(totalBalls * 0.6);
  const longBalls = totalBalls - shortBalls;

  if (shortGame.length > 0) {
    const perShort = Math.floor(shortBalls / shortGame.length);
    shortGame.forEach((s) => {
      const balls = Math.min(perShort, remaining);
      if (balls > 0) {
        plan.push({ ...s, balls });
        remaining -= balls;
      }
    });
  }

  if (longGame.length > 0) {
    const perLong = Math.floor(longBalls / longGame.length);
    longGame.forEach((s) => {
      const balls = Math.min(perLong, remaining);
      if (balls > 0) {
        plan.push({ ...s, balls });
        remaining -= balls;
      }
    });
  }

  // Distribute remainder
  for (let i = 0; remaining > 0 && i < plan.length; i++) {
    plan[i].balls += 1;
    remaining -= 1;
  }

  return plan;
}

/** Handicap Improvement: focus on consistency, more reps per club. */
export function buildHandicapPlan(handicap: string, bag: string[]): PlanStep[] {
  const slots = STEP_LABELS.filter((s) => bag.includes(s.key));
  if (slots.length === 0) return [];

  // Higher handicap = more total balls, focus on fundamentals
  const ballsByHandicap: Record<string, number> = {
    "30+": 150,
    "20-30": 120,
    "15-20": 100,
    "10-15": 80,
    "under-10": 60,
  };

  const totalBalls = ballsByHandicap[handicap] ?? 100;

  // Focus on 2-3 clubs max for consistency (pick first 2-3 from bag)
  const focusClubs = slots.slice(0, Math.min(3, slots.length));
  const base = Math.floor(totalBalls / focusClubs.length);
  let remainder = totalBalls - base * focusClubs.length;

  return focusClubs.map((s) => {
    let balls = base;
    if (remainder > 0) {
      balls += 1;
      remainder -= 1;
    }
    return { ...s, balls };
  });
}

/** Fix My Miss: targeted practice based on miss type. */
export function buildFixMissPlan(miss: string, bag: string[]): PlanStep[] {
  const slots = STEP_LABELS.filter((s) => bag.includes(s.key));
  if (slots.length === 0) return [];

  // For slice/hook/directional issues: focus on mid-irons and driver
  // For fat/thin: focus on short irons and wedges
  const directionalMisses = ["slice", "hook", "push-right", "pull-left"];
  const contactMisses = ["fat", "thin"];

  let focusClubs: typeof slots;
  if (directionalMisses.includes(miss)) {
    // Mid-irons (7I, 8I, 9I) + driver
    focusClubs = slots.filter((s) => ["i7", "i8", "i9", "driver"].includes(s.key));
  } else if (contactMisses.includes(miss)) {
    // Wedges and short irons
    focusClubs = slots.filter((s) => ["sw", "pw", "i9", "i8"].includes(s.key));
  } else {
    focusClubs = slots;
  }

  if (focusClubs.length === 0) focusClubs = slots;

  const totalBalls = 80; // Focused session
  const base = Math.floor(totalBalls / focusClubs.length);
  let remainder = totalBalls - base * focusClubs.length;

  return focusClubs.map((s) => {
    let balls = base;
    if (remainder > 0) {
      balls += 1;
      remainder -= 1;
    }
    return { ...s, balls };
  });
}

/** Convert an AI ball-count map (clubKey -> balls) into an ordered PlanStep[]. */
export function planStepsFromCounts(counts: Record<string, number>): PlanStep[] {
  return STEP_LABELS.filter((s) => (counts[s.key] ?? 0) > 0).map((s) => ({
    ...s,
    balls: counts[s.key],
  }));
}

/** Format seconds as a compact "Xm" or "Xm Ys" string. */
export function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

/* ───────── Statistics (pure math) ───────── */

export type ClubStats = {
  shots: number;
  averageDistance: number;
  bestDistance: number;
  stdDev: number;
  outShots: number;
  leftPct: number;
  centerPct: number;
  rightPct: number;
};

function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

/** Group shots by club and compute distance + direction statistics. */
export function computeStats(shots: Shot[]): Record<string, ClubStats> {
  const byClub: Record<string, Shot[]> = {};
  for (const s of shots) {
    (byClub[s.club] ??= []).push(s);
  }

  const stats: Record<string, ClubStats> = {};
  for (const [club, list] of Object.entries(byClub)) {
    const total = list.length;
    // Only numeric distances count toward average/best; "Out" shots are tracked separately.
    const numeric = list
      .map((s) => s.distance)
      .filter((d): d is number => typeof d === "number");
    const outShots = total - numeric.length;
    const left = list.filter((s) => s.direction === "Left").length;
    const center = list.filter((s) => s.direction === "Center").length;
    const right = list.filter((s) => s.direction === "Right").length;

    const avg = numeric.length
      ? Math.round(numeric.reduce((a, b) => a + b, 0) / numeric.length)
      : 0;
    const variance =
      numeric.length > 1
        ? numeric.reduce((acc, d) => acc + (d - avg) ** 2, 0) / numeric.length
        : 0;

    stats[club] = {
      shots: total,
      averageDistance: avg,
      bestDistance: numeric.length ? Math.max(...numeric) : 0,
      stdDev: Math.round(Math.sqrt(variance)),
      outShots,
      leftPct: pct(left, total),
      centerPct: pct(center, total),
      rightPct: pct(right, total),
    };
  }
  return stats;
}

/** Club with the highest center-hit % this session (min 2 shots). null if none. */
export function mostConsistentClub(
  stats: Record<string, ClubStats>
): { club: string; centerPct: number } | null {
  let best: { club: string; centerPct: number } | null = null;
  for (const [club, s] of Object.entries(stats)) {
    if (s.shots < 2) continue;
    if (!best || s.centerPct > best.centerPct) {
      best = { club, centerPct: s.centerPct };
    }
  }
  return best;
}

/** A meaningful achievement to celebrate at the end of a session. */
export type SessionWin = {
  label: string;
  detail: string;
  highlight: boolean; // gold emphasis for genuinely new records
};

/**
 * Pick the session's most meaningful wins for the summary. Prioritises genuine
 * new personal bests, then the longest drive and most consistent club. Always
 * returns at least one win (the session's standout club) so there is something
 * to celebrate even when no records fall.
 */
export function computeSessionWins(
  stats: Record<string, ClubStats>,
  priorRecords: Record<string, number>,
  unit: Unit
): SessionWin[] {
  const wins: SessionWin[] = [];
  const newPRClubs = new Set<string>();

  for (const [club, s] of Object.entries(stats)) {
    if (
      s.bestDistance > 0 &&
      priorRecords[club] != null &&
      s.bestDistance > priorRecords[club]
    ) {
      newPRClubs.add(club);
      wins.push({
        label: "New Personal Best",
        detail: `${club} ${fmtDist(s.bestDistance, unit)}`,
        highlight: true,
      });
    }
  }

  const driver = stats["DR"];
  if (driver && driver.bestDistance > 0 && !newPRClubs.has("DR")) {
    wins.push({
      label: "Longest Drive",
      detail: fmtDist(driver.bestDistance, unit),
      highlight: false,
    });
  }

  const consistent = mostConsistentClub(stats);
  if (consistent && consistent.centerPct > 0) {
    wins.push({
      label: "Most Consistent",
      detail: `${consistent.club} · ${consistent.centerPct}% centered`,
      highlight: false,
    });
  }

  // Always celebrate something: the session's standout club by accuracy.
  if (!wins.length) {
    const standout = Object.entries(stats)
      .filter(([, s]) => s.shots >= 2 && s.averageDistance > 0)
      .sort((a, b) => b[1].centerPct - a[1].centerPct)[0];
    if (standout) {
      wins.push({
        label: "Today's Highlight",
        detail: `${standout[0]} · ${standout[1].centerPct}% centered`,
        highlight: false,
      });
    }
  }

  return wins.slice(0, 4);
}
