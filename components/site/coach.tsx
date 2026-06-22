"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Target,
  Flag,
  TrendingUp,
  Crosshair,
  RotateCcw,
  Loader2,
  Trophy,
  Flame,
  Share2,
} from "lucide-react";
import {
  analyzeSession,
  saveSession,
  updateSessionFeeling,
  getCoachProgress,
  getCurrentUser,
  signOut,
} from "@/app/actions";
import type {
  CoachReport,
  SessionFeeling,
  CoachProgress,
  ClubStatRecord,
} from "@/lib/coach";
import type { AuthUser } from "@/lib/auth";
import { SaveProgressCard } from "./coach-auth";

/* ───────── Data model ───────── */

type PracticeKey = "driving-range" | "warm-up" | "handicap" | "fix-miss";

type PracticeType = {
  key: PracticeKey;
  /** Value used in the returned JSON `practiceType` field. */
  label: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Heading shown above the second step. */
  stepTitle: string;
  /** Key used for the chosen option in the returned JSON. */
  optionKey: string;
  options: { label: string; value: string | number }[];
};

const PRACTICE_TYPES: PracticeType[] = [
  {
    key: "driving-range",
    label: "Driving Range",
    title: "Driving Range Practice",
    desc: "Volume reps, dialed in.",
    icon: Target,
    stepTitle: "How many balls?",
    optionKey: "ballCount",
    options: [
      { label: "50 Balls", value: 50 },
      { label: "100 Balls", value: 100 },
      { label: "150 Balls", value: 150 },
      { label: "200 Balls", value: 200 },
    ],
  },
  {
    key: "warm-up",
    label: "Warm Up",
    title: "Warm Up Before Round",
    desc: "Get loose, hit the first tee ready.",
    icon: Flag,
    stepTitle: "Round length?",
    optionKey: "holes",
    options: [
      { label: "9 Holes", value: 9 },
      { label: "18 Holes", value: 18 },
    ],
  },
  {
    key: "handicap",
    label: "Handicap Improvement",
    title: "Handicap Improvement",
    desc: "Train to drop your number.",
    icon: TrendingUp,
    stepTitle: "Current handicap?",
    optionKey: "handicap",
    options: [
      { label: "30+", value: "30+" },
      { label: "20–30", value: "20-30" },
      { label: "15–20", value: "15-20" },
      { label: "10–15", value: "10-15" },
      { label: "Under 10", value: "under-10" },
    ],
  },
  {
    key: "fix-miss",
    label: "Fix My Miss",
    title: "Fix My Miss",
    desc: "Target the shot that costs you strokes.",
    icon: Crosshair,
    stepTitle: "What's your miss?",
    optionKey: "miss",
    options: [
      { label: "Slice", value: "slice" },
      { label: "Hook", value: "hook" },
      { label: "Push Right", value: "push-right" },
      { label: "Pull Left", value: "pull-left" },
      { label: "Fat Shot", value: "fat" },
      { label: "Thin Shot", value: "thin" },
    ],
  },
];

/* ───────── Static training plans (hardcoded — no AI / no API) ───────── */

type PlanStep = { key: string; label: string; club: string; target: number; balls: number };

/** Order + display labels + club abbreviation + target (m) for every plan slot. */
const STEP_LABELS: { key: string; label: string; club: string; target: number }[] = [
  { key: "sw", label: "Sand Wedge", club: "SW", target: 60 },
  { key: "pw", label: "Pitching Wedge", club: "PW", target: 90 },
  { key: "i9", label: "9 Iron", club: "9I", target: 110 },
  { key: "i8", label: "8 Iron", club: "8I", target: 125 },
  { key: "i7", label: "7 Iron", club: "7I", target: 140 },
  { key: "i6", label: "6 Iron", club: "6I", target: 155 },
  { key: "i5", label: "5 Iron", club: "5I", target: 170 },
  { key: "driver", label: "Driver", club: "DR", target: 230 },
];

const OUT = "Out" as const;
type DistanceResult = number | typeof OUT;

/**
 * Distance result options (m) scaled to the club's target, in 5 m steps.
 * A wedge offers ~10–110 m; a driver offers ~180–280 m. Prevents the old
 * one-size-fits-all 30–130 m list that capped the driver far too low.
 */
function distanceOptions(target: number): number[] {
  const min = Math.max(5, Math.round((target - 50) / 5) * 5);
  const max = Math.round((target + 50) / 5) * 5;
  const out: number[] = [];
  for (let d = min; d <= max; d += 5) out.push(d);
  return out;
}

/** Direction options. */
const DIRECTIONS = ["Left", "Center", "Right"] as const;
type Direction = (typeof DIRECTIONS)[number];

type Shot = {
  club: string;
  target: number;
  distance: DistanceResult;
  direction: Direction;
};

/** Selectable clubs for the bag. */
const BAG_CLUBS = STEP_LABELS;

/** Look up a club's short abbreviation from its plan key. */
function clubAbbr(key: string): string {
  return STEP_LABELS.find((s) => s.key === key)?.club ?? key.toUpperCase();
}

/**
 * Build a plan for the given ball count, distributing balls evenly across
 * the clubs the user actually has in their bag.
 */
function buildPlan(ballCount: number, bag: string[]): PlanStep[] {
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

const DEFAULT_DIRECTION: Direction = "Center";

/** Format seconds as a compact "Xm" or "Xm Ys" string. */
function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

/** Self-assessment options for Section 5. */
const FEELINGS: { value: SessionFeeling; label: string }[] = [
  { value: "weak", label: "Weak" },
  { value: "normal", label: "Normal" },
  { value: "strong", label: "Strong" },
  { value: "very_strong", label: "Very Strong" },
];

/** Anonymous, per-device id stored in localStorage (no login required). */
function getClientId(): string {
  if (typeof window === "undefined") return "";
  const KEY = "gg_coach_client_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

/* ───────── Statistics (pure math — no AI / no API) ───────── */

type ClubStats = {
  shots: number;
  averageDistance: number;
  bestDistance: number;
  outShots: number;
  leftPct: number;
  centerPct: number;
  rightPct: number;
};

function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

/** Group shots by club and compute distance + direction statistics. */
function computeStats(shots: Shot[]): Record<string, ClubStats> {
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

    stats[club] = {
      shots: total,
      averageDistance: numeric.length
        ? Math.round(numeric.reduce((a, b) => a + b, 0) / numeric.length)
        : 0,
      bestDistance: numeric.length ? Math.max(...numeric) : 0,
      outShots,
      leftPct: pct(left, total),
      centerPct: pct(center, total),
      rightPct: pct(right, total),
    };
  }
  return stats;
}

/** Club with the highest center-hit % this session (min 2 shots). null if none. */
function mostConsistentClub(
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

/* ───────── Component ───────── */

export function Coach() {
  const [type, setType] = useState<PracticeType | null>(null);
  const [option, setOption] = useState<{ label: string; value: string | number } | null>(null);
  const [started, setStarted] = useState(false);

  // My Bag — clubs the user actually owns (defaults to all).
  const [bag, setBag] = useState<string[]>(BAG_CLUBS.map((c) => c.key));

  // Session (shot-by-shot logging)
  const [stepIndex, setStepIndex] = useState<number | null>(null); // null = not in session
  const [shotNum, setShotNum] = useState(1); // 1-based within current club
  const [distance, setDistance] = useState<DistanceResult>(STEP_LABELS[0].target);
  const [direction, setDirection] = useState<Direction>(DEFAULT_DIRECTION);
  const [shots, setShots] = useState<Shot[]>([]);

  // Session timing
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [durationSecs, setDurationSecs] = useState(0);

  // AI report
  const [report, setReport] = useState<CoachReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Self-assessment (Section 5)
  const [feeling, setFeeling] = useState<SessionFeeling | null>(null);
  const [feelingSaved, setFeelingSaved] = useState(false);

  // Persistence + progress
  const [savedSessionId, setSavedSessionId] = useState<number | null>(null);
  const [progress, setProgress] = useState<CoachProgress | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  // Auth (passwordless) + returning-user dashboard
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dashboard, setDashboard] = useState<CoachProgress | null>(null);

  // Auto sign-in via secure cookie, then load the returning-user dashboard.
  useEffect(() => {
    let active = true;
    (async () => {
      const u = await getCurrentUser();
      if (!active || !u) return;
      setUser(u);
      const prog = await getCoachProgress(getClientId(), undefined, u.id);
      if (active) setDashboard(prog);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSignedIn(u: AuthUser) {
    setUser(u);
    // Refresh progress now scoped to the user (includes just-linked history).
    const prog = await getCoachProgress(getClientId(), savedSessionId ?? undefined, u.id);
    setProgress(prog);
    setDashboard(prog);
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setDashboard(null);
  }

  const result =
    type && option
      ? { practiceType: type.label, [type.optionKey]: option.value }
      : null;

  const plan =
    type?.key === "driving-range" && typeof option?.value === "number"
      ? buildPlan(option.value, bag)
      : [];

  const inSession = stepIndex !== null;
  const currentStep = inSession && plan[stepIndex] ? plan[stepIndex] : null;
  const sessionComplete = inSession && !currentStep;

  // Shot-button labelling (feedback #4).
  const isLastShotOfClub = currentStep ? shotNum >= currentStep.balls : false;
  const isLastClub = stepIndex !== null && stepIndex >= plan.length - 1;
  const shotButtonLabel = !currentStep
    ? "Save Shot"
    : isLastShotOfClub
      ? isLastClub
        ? "Finish Session"
        : `Next Club \u2192 ${clubAbbr(plan[(stepIndex ?? 0) + 1]?.key)}`
      : "Save Shot";

  function toggleClub(key: string) {
    setBag((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  // Live shot object — matches the required Result JSON contract exactly.
  const shot: Shot | null = currentStep
    ? { club: currentStep.club, target: currentStep.target, distance, direction }
    : null;

  function startSession() {
    if (!plan.length) return;
    setStepIndex(0);
    setShotNum(1);
    setDistance(plan[0].target);
    setDirection(DEFAULT_DIRECTION);
    setShots([]);
    setStartedAt(Date.now());
    setDurationSecs(0);
  }

  function saveShot() {
    if (!currentStep || !shot) return;
    setShots((prev) => [...prev, shot]);

    if (isLastShotOfClub) {
      const next = (stepIndex ?? 0) + 1;
      // Last shot of the last club ends the session — capture its duration.
      if (next >= plan.length && startedAt) {
        setDurationSecs(Math.round((Date.now() - startedAt) / 1000));
      }
      setStepIndex(next);
      setShotNum(1);
      setDistance(plan[next]?.target ?? STEP_LABELS[0].target);
    } else {
      setShotNum((n) => n + 1);
      setDistance(currentStep.target);
    }
    setDirection(DEFAULT_DIRECTION);
  }

  async function requestReport() {
    if (!shots.length || !type) return;
    setLoadingReport(true);
    setReportError(null);

    const stats = computeStats(shots);
    const res = await analyzeSession({
      plan,
      results: shots,
      stats,
      bag: bag.map(clubAbbr),
      totalBalls: shots.length,
      durationSecs,
    });

    if (!res.ok) {
      setLoadingReport(false);
      setReportError(res.message);
      return;
    }
    setReport(res.report);

    // Persist the session (per-club bests keyed by club abbreviation), then load
    // cross-session progress + prior records so we can flag new personal records.
    const clubStats: Record<string, ClubStatRecord> = {};
    for (const [club, s] of Object.entries(stats)) {
      clubStats[club] = { best: s.bestDistance, center: s.centerPct, shots: s.shots };
    }
    const clientId = getClientId();
    const save = await saveSession({
      clientId,
      practiceType: type.label,
      totalBalls: shots.length,
      durationSecs,
      clubsPracticed: Object.keys(stats).length,
      practiceScore: res.report.practiceScore,
      primaryLimitation: res.report.primaryLimitation.title,
      nextGoal: res.report.nextGoal,
      clubStats,
    });
    const savedId = save.ok ? save.id ?? null : null;
    setSavedSessionId(savedId);

    const prog = await getCoachProgress(clientId, savedId ?? undefined, user?.id);
    setProgress(prog);
    if (user) setDashboard(prog);

    setLoadingReport(false);
  }

  async function chooseFeeling(value: SessionFeeling) {
    setFeeling(value);
    if (!savedSessionId) return;
    const res = await updateSessionFeeling(savedSessionId, value);
    if (res.ok) setFeelingSaved(true);
  }

  /** Render a branded achievement card to a PNG and share/download it (Section 7). */
  async function shareProgress() {
    setShareError(null);
    try {
      const stats = computeStats(shots);
      const driverBest = stats["DR"]?.bestDistance ?? 0;
      const mostConsistent = mostConsistentClub(stats);
      const W = 1080;
      const H = 1350;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas context");

      // Background
      ctx.fillStyle = "#0b0b0c";
      ctx.fillRect(0, 0, W, H);
      // Gold ambient glow
      const glow = ctx.createRadialGradient(W * 0.8, H * 0.15, 0, W * 0.8, H * 0.15, W * 0.8);
      glow.addColorStop(0, "rgba(241,192,78,0.16)");
      glow.addColorStop(1, "rgba(241,192,78,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      // Border
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 48, W - 96, H - 96);

      const gold = "#f1c04e";
      const white = "#ffffff";
      const muted = "rgba(255,255,255,0.55)";

      // Brand
      ctx.textAlign = "left";
      ctx.fillStyle = gold;
      ctx.font = "800 40px Arial, sans-serif";
      ctx.fillText("GAUGE GOLF", 96, 150);
      ctx.fillStyle = muted;
      ctx.font = "600 24px Arial, sans-serif";
      ctx.fillText(
        new Date().toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        96,
        190
      );

      // Headline
      ctx.fillStyle = white;
      ctx.font = "800 96px Arial, sans-serif";
      ctx.fillText(`${shots.length}`, 96, 360);
      ctx.fillStyle = muted;
      ctx.font = "700 32px Arial, sans-serif";
      ctx.fillText("BALLS HIT THIS SESSION", 96, 410);

      // Stat rows
      const rows: [string, string][] = [
        ["Longest Driver", driverBest ? `${driverBest} m` : "—"],
        ["Most Consistent", mostConsistent ? mostConsistent.club : "—"],
        ["Current Streak", `${progress?.streakWeeks ?? 0} wk`],
        ["Total Balls Hit", `${(progress?.totalBalls ?? shots.length).toLocaleString()}`],
      ];
      let y = 540;
      for (const [label, value] of rows) {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(96, y, W - 192, 120);
        ctx.fillStyle = muted;
        ctx.font = "600 28px Arial, sans-serif";
        ctx.fillText(label.toUpperCase(), 128, y + 50);
        ctx.fillStyle = gold;
        ctx.textAlign = "right";
        ctx.font = "800 56px Arial, sans-serif";
        ctx.fillText(value, W - 128, y + 78);
        ctx.textAlign = "left";
        y += 144;
      }

      // Footer
      ctx.fillStyle = muted;
      ctx.font = "600 26px Arial, sans-serif";
      ctx.fillText("Train with intent. gaugegolf.com", 96, H - 96);

      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, "image/png")
      );
      if (!blob) throw new Error("could not render image");

      const file = new File([blob], "gauge-golf-session.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
      };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Gauge Golf",
          text: "My range session 🏌️",
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "gauge-golf-session.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("shareProgress() failed:", err);
      setShareError("Couldn't create the share image. Try again.");
    }
  }

  function reset() {
    setType(null);
    setOption(null);
    setStarted(false);
    setBag(BAG_CLUBS.map((c) => c.key));
    setStepIndex(null);
    setShotNum(1);
    setShots([]);
    setStartedAt(null);
    setDurationSecs(0);
    setReport(null);
    setReportError(null);
    setFeeling(null);
    setFeelingSaved(false);
    setSavedSessionId(null);
    setProgress(null);
    setShareError(null);
  }

  // Derived end-of-session figures (used by Sections 1, 2 and 7).
  const sessionStats = sessionComplete ? computeStats(shots) : {};
  const clubsPracticed = Object.keys(sessionStats).length;
  const recordsPrior = progress?.recordsByClub ?? {};
  const consistentClub = mostConsistentClub(sessionStats);
  const driverBest = sessionStats["DR"]?.bestDistance ?? 0;
  const driverIsNew =
    driverBest > 0 && recordsPrior["DR"] != null && driverBest > recordsPrior["DR"];
  const longestIron = Object.entries(sessionStats)
    .filter(([club]) => club !== "DR")
    .reduce<{ club: string; distance: number } | null>(
      (acc, [club, s]) =>
        s.bestDistance > (acc?.distance ?? 0) ? { club, distance: s.bestDistance } : acc,
      null
    );
  const newPRs = Object.entries(sessionStats)
    .filter(
      ([club, s]) =>
        s.bestDistance > 0 &&
        recordsPrior[club] != null &&
        s.bestDistance > recordsPrior[club]
    )
    .map(([club, s]) => ({ club, distance: s.bestDistance }));

  return (
    <main className="relative flex min-h-[100svh] flex-col overflow-hidden">
      {/* ambient bg — matches site language */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[10%] bg-[radial-gradient(60%_40%_at_80%_15%,rgba(241,192,78,0.10),transparent_60%),radial-gradient(50%_40%_at_10%_110%,rgba(241,192,78,0.06),transparent_70%)]"
      />

      <div className="relative mx-auto flex w-full max-w-[640px] flex-1 flex-col px-6 py-10 md:py-14">
        {/* Progress / header */}
        <header className="flex items-center justify-between">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/20 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">
            <span className="size-1.5 animate-pulse-gold rounded-full bg-gold" />
            <span>
              {inSession
                ? sessionComplete
                  ? "Complete"
                  : currentStep?.label
                : started
                  ? "Your Plan"
                  : !type
                    ? "Step 1 / 2"
                    : !option
                      ? "Step 2 / 2"
                      : "Ready"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {((type && !result) || started) && (
              <button
                onClick={() =>
                  inSession
                    ? setStepIndex(null)
                    : started
                      ? setStarted(false)
                      : option
                        ? setOption(null)
                        : setType(null)
                }
                className="inline-flex items-center gap-2 font-display text-[12px] font-bold uppercase tracking-[0.14em] text-white/60 transition hover:text-white"
              >
                <ArrowLeft className="size-3.5" strokeWidth={2.5} />
                Back
              </button>
            )}
            {user && (
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/[0.06] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold transition hover:bg-gold/[0.12]"
              >
                {user.id}
              </button>
            )}
          </div>
        </header>

        <div
          className={`flex flex-1 flex-col py-10 ${
            started || inSession || (result && type?.key === "driving-range")
              ? "justify-start"
              : "justify-center"
          }`}
        >
          {/* STEP 1 — Practice type */}
          {!type && (
            <section>
              {/* Returning-user dashboard */}
              {user && dashboard && dashboard.totalSessions > 0 && (
                <div className="mb-8 rounded-[18px] border border-gold/30 bg-gold/[0.04] p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
                      Welcome back
                    </span>
                    <span className="font-display text-[13px] font-bold text-gold">{user.id}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-[12px] bg-white/[0.04] px-3 py-3 text-center">
                      <span className="flex items-center justify-center gap-1 font-display text-[22px] font-extrabold leading-none">
                        {dashboard.streakWeeks}
                        <Flame className="size-4 text-gold" strokeWidth={2.5} />
                      </span>
                      <span className="mt-1 block text-[9px] uppercase tracking-[0.12em] text-white/45">
                        Streak
                      </span>
                    </div>
                    <div className="rounded-[12px] bg-white/[0.04] px-3 py-3 text-center">
                      <span className="font-display text-[22px] font-extrabold leading-none">
                        {dashboard.totalSessions}
                      </span>
                      <span className="mt-1 block text-[9px] uppercase tracking-[0.12em] text-white/45">
                        Sessions
                      </span>
                    </div>
                    <div className="rounded-[12px] bg-white/[0.04] px-3 py-3 text-center">
                      <span className="font-display text-[22px] font-extrabold leading-none">
                        {dashboard.totalBalls.toLocaleString()}
                      </span>
                      <span className="mt-1 block text-[9px] uppercase tracking-[0.12em] text-white/45">
                        Balls
                      </span>
                    </div>
                  </div>
                  {(dashboard.recordsByClub["DR"] || dashboard.mostConsistentClub) && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {dashboard.recordsByClub["DR"] ? (
                        <div className="flex items-center justify-between rounded-[12px] bg-white/[0.04] px-4 py-3">
                          <span className="text-[12px] text-white/55">Longest Driver</span>
                          <span className="font-display text-[15px] font-extrabold text-gold">
                            {dashboard.recordsByClub["DR"]} m
                          </span>
                        </div>
                      ) : null}
                      {dashboard.mostConsistentClub ? (
                        <div className="flex items-center justify-between rounded-[12px] bg-white/[0.04] px-4 py-3">
                          <span className="text-[12px] text-white/55">Most Consistent</span>
                          <span className="font-display text-[15px] font-extrabold text-gold">
                            {dashboard.mostConsistentClub}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              <h1 className="font-display text-[clamp(34px,8vw,56px)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em]">
                What are you<br />
                <span className="text-gold">working on?</span>
              </h1>
              <p className="mt-4 max-w-[40ch] text-base text-white/60">
                Pick a practice type. You&apos;ll be hitting balls in seconds — no login, no setup.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PRACTICE_TYPES.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.key}
                      onClick={() => setType(p)}
                      className="group flex items-start gap-4 rounded-[18px] border border-white/15 bg-white/[0.02] p-5 text-left transition hover:border-gold hover:bg-white/[0.04] active:translate-y-px"
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] border border-white/15 bg-ink-3 text-gold transition group-hover:border-gold/50">
                        <Icon className="size-5" strokeWidth={2} />
                      </span>
                      <span className="flex flex-col">
                        <span className="font-display text-[17px] font-bold leading-tight tracking-wide">
                          {p.title}
                        </span>
                        <span className="mt-1 text-[13px] leading-snug text-white/50">
                          {p.desc}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 2 — Options for chosen type */}
          {type && !option && (
            <section>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                {type.title}
              </span>
              <h1 className="mt-3 font-display text-[clamp(34px,8vw,56px)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em]">
                <span className="text-gold">{type.stepTitle}</span>
              </h1>

              <div className="mt-8 grid grid-cols-2 gap-3">
                {type.options.map((o) => (
                  <button
                    key={String(o.value)}
                    onClick={() => setOption(o)}
                    className="flex items-center justify-center rounded-[18px] border border-white/15 bg-white/[0.02] px-4 py-6 font-display text-[18px] font-bold uppercase tracking-wide transition hover:border-gold hover:bg-white/[0.04] active:translate-y-px"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* MY BAG — choose the clubs you actually carry (driving range) */}
          {result && type && option && !started && type.key === "driving-range" && (
            <section className="pb-28">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                {type.title} · {option.label}
              </span>
              <h1 className="mt-3 font-display text-[clamp(34px,8vw,56px)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em]">
                Your <span className="text-gold">bag</span>
              </h1>
              <p className="mt-4 max-w-[40ch] text-base text-white/60">
                Tap to remove any club you don&apos;t carry. We&apos;ll only plan shots for what&apos;s in your bag.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {BAG_CLUBS.map((c) => {
                  const active = bag.includes(c.key);
                  return (
                    <button
                      key={c.key}
                      onClick={() => toggleClub(c.key)}
                      className={`flex flex-col items-center gap-1 rounded-[14px] border px-3 py-4 transition active:translate-y-px ${
                        active
                          ? "border-gold bg-gold/10"
                          : "border-white/10 bg-white/[0.02] opacity-50 hover:opacity-100"
                      }`}
                    >
                      <span
                        className={`font-display text-[20px] font-extrabold tracking-wide ${
                          active ? "text-gold" : "text-white"
                        }`}
                      >
                        {c.club}
                      </span>
                      <span className="text-[11px] leading-tight text-white/50">{c.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Fixed bottom action bar */}
              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-ink/95 px-6 py-4 backdrop-blur">
                <div className="mx-auto max-w-[640px]">
                  <button
                    onClick={() => bag.length && setStarted(true)}
                    disabled={!bag.length}
                    className="flex w-full items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-4 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px disabled:opacity-40"
                  >
                    Continue · {bag.length} {bag.length === 1 ? "club" : "clubs"}
                    <ArrowRight className="size-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* CONFIRMATION — non driving-range practice types (no plan flow) */}
          {result && type && option && !started && type.key !== "driving-range" && (
            <section>
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-gold text-ink">
                <Check className="size-7" strokeWidth={3} />
              </span>
              <h1 className="mt-6 font-display text-[clamp(34px,8vw,56px)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em]">
                You&apos;re set.
              </h1>
              <p className="mt-4 text-base text-white/60">
                <span className="text-white">{type.title}</span> · {option.label}
              </p>

              <button
                onClick={reset}
                className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-white/20 px-6 py-4 font-display text-[13px] font-bold uppercase tracking-[0.14em] transition hover:border-white active:translate-y-px"
              >
                <RotateCcw className="size-3.5" strokeWidth={2.5} />
                Start Over
              </button>
            </section>
          )}

          {/* TRAINING PLAN — cards built from the user's bag */}
          {started && !inSession && plan.length > 0 && type && option && (
            <section className="pb-28">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                {type.title} · {option.label}
              </span>
              <h1 className="mt-3 font-display text-[clamp(34px,8vw,56px)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em]">
                Your <span className="text-gold">Plan</span>
              </h1>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {plan.map((s) => (
                  <div
                    key={s.key}
                    className="flex flex-col justify-between rounded-[18px] border border-white/15 bg-white/[0.02] p-5"
                  >
                    <span className="font-display text-[15px] font-bold uppercase leading-tight tracking-wide">
                      {s.label}
                    </span>
                    <span className="mt-4 flex items-baseline gap-1.5">
                      <span className="font-display text-[34px] font-extrabold leading-none text-gold">
                        {s.balls}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">
                        balls
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Fixed bottom action bar */}
              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-ink/95 px-6 py-4 backdrop-blur">
                <div className="mx-auto max-w-[640px]">
                  <button
                    onClick={startSession}
                    className="flex w-full items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-4 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px"
                  >
                    Start Session
                    <ArrowRight className="size-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* SHOT INPUT — log one shot at a time */}
          {inSession && currentStep && shot && (
            <section className="pb-28">
              {/* Club / Target / Shot counter */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[18px] border border-white/15 bg-white/[0.02] p-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    Club
                  </span>
                  <p className="mt-1 font-display text-[22px] font-extrabold tracking-wide text-gold">
                    {currentStep.club}
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/15 bg-white/[0.02] p-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    Target
                  </span>
                  <p className="mt-1 font-display text-[22px] font-extrabold tracking-wide">
                    {currentStep.target}m
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/15 bg-white/[0.02] p-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    Shot
                  </span>
                  <p className="mt-1 font-display text-[22px] font-extrabold tracking-wide">
                    {shotNum} / {currentStep.balls}
                  </p>
                </div>
              </div>

              {/* Input 1 — Distance Result */}
              <div className="mt-8">
                <label
                  htmlFor="distance"
                  className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40"
                >
                  Distance Result
                </label>
                <select
                  id="distance"
                  value={String(distance)}
                  onChange={(e) =>
                    setDistance(e.target.value === OUT ? OUT : Number(e.target.value))
                  }
                  className="mt-3 w-full rounded-[14px] border border-white/15 bg-ink-2 px-5 py-4 font-display text-[18px] font-bold tracking-wide text-white outline-none transition focus:border-gold"
                >
                  {distanceOptions(currentStep.target).map((d) => (
                    <option key={d} value={d}>
                      {d}m
                    </option>
                  ))}
                  <option value={OUT}>Out / Missed</option>
                </select>
                <p className="mt-2 text-[12px] leading-snug text-white/40">
                  Pick &ldquo;Out / Missed&rdquo; if the ball flew off-target or you mishit it.
                </p>
              </div>

              {/* Input 2 — Direction */}
              <div className="mt-6">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                  Direction
                </span>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {DIRECTIONS.map((d) => {
                    const active = direction === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setDirection(d)}
                        className={`rounded-[14px] border px-4 py-4 font-display text-[15px] font-bold uppercase tracking-wide transition active:translate-y-px ${
                          active
                            ? "border-gold bg-gold text-ink"
                            : "border-white/15 bg-white/[0.02] text-white hover:border-gold"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fixed bottom action bar */}
              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-ink/95 px-6 py-4 backdrop-blur">
                <div className="mx-auto max-w-[640px]">
                  <button
                    onClick={saveShot}
                    className="flex w-full items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-4 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px"
                  >
                    {shotButtonLabel}
                    {!isLastShotOfClub && <ArrowRight className="size-3.5" strokeWidth={2.5} />}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* SESSION COMPLETE */}
          {sessionComplete && (
            <section>
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-gold text-ink">
                <Check className="size-7" strokeWidth={3} />
              </span>
              <h1 className="mt-6 font-display text-[clamp(34px,8vw,56px)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em]">
                Session <span className="text-gold">done.</span>
              </h1>
              <p className="mt-4 text-base text-white/60">
                {report
                  ? "Here's what your coach saw today."
                  : "Nice work. Let your coach break it down for you."}
              </p>

              {/* Pre-report: compact summary + coaching CTA */}
              {!report && (
                <>
                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <div className="rounded-[16px] border border-white/15 bg-white/[0.02] px-5 py-4">
                      <span className="block text-[11px] uppercase tracking-[0.14em] text-white/40">
                        Total Balls
                      </span>
                      <span className="font-display text-[26px] font-extrabold">{shots.length}</span>
                    </div>
                    <div className="rounded-[16px] border border-white/15 bg-white/[0.02] px-5 py-4">
                      <span className="block text-[11px] uppercase tracking-[0.14em] text-white/40">
                        Duration
                      </span>
                      <span className="font-display text-[26px] font-extrabold">
                        {formatDuration(durationSecs)}
                      </span>
                    </div>
                  </div>

                  {!loadingReport && (
                    <button
                      onClick={requestReport}
                      className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-4 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px"
                    >
                      Get My Coaching
                      <ArrowRight className="size-3.5" strokeWidth={2.5} />
                    </button>
                  )}

                  {loadingReport && (
                    <div className="mt-8 flex items-center gap-3 rounded-[18px] border border-white/15 bg-white/[0.02] px-5 py-4">
                      <Loader2 className="size-5 animate-spin text-gold" />
                      <span className="font-display text-[15px] font-bold uppercase tracking-wide text-white/60">
                        Your coach is reviewing your session...
                      </span>
                    </div>
                  )}

                  {reportError && (
                    <div className="mt-8 rounded-[18px] border border-red-500/30 bg-red-500/5 px-5 py-4 text-[14px] text-red-400">
                      {reportError}
                    </div>
                  )}
                </>
              )}

              {/* Coaching report */}
              {report && (
                <div className="mt-8 space-y-6">
                  {/* Section 1 — Session Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-[16px] border border-white/15 bg-white/[0.02] px-4 py-4 text-center">
                      <span className="font-display text-[30px] font-extrabold leading-none">
                        {shots.length}
                      </span>
                      <span className="mt-1.5 block text-[10px] uppercase tracking-[0.14em] text-white/50">
                        Balls Hit
                      </span>
                    </div>
                    <div className="rounded-[16px] border border-white/15 bg-white/[0.02] px-4 py-4 text-center">
                      <span className="font-display text-[26px] font-extrabold leading-none">
                        {formatDuration(durationSecs)}
                      </span>
                      <span className="mt-1.5 block text-[10px] uppercase tracking-[0.14em] text-white/50">
                        Duration
                      </span>
                    </div>
                    <div className="rounded-[16px] border border-white/15 bg-white/[0.02] px-4 py-4 text-center">
                      <span className="font-display text-[30px] font-extrabold leading-none">
                        {clubsPracticed}
                      </span>
                      <span className="mt-1.5 block text-[10px] uppercase tracking-[0.14em] text-white/50">
                        Clubs Practiced
                      </span>
                    </div>
                  </div>

                  {/* Section 2 — Personal Records */}
                  {(driverBest > 0 || longestIron || consistentClub) && (
                    <div className="rounded-[18px] border border-white/15 bg-white/[0.02] p-6">
                      <h3 className="flex items-center gap-2 font-display text-[16px] font-bold uppercase tracking-wide text-gold">
                        <Trophy className="size-4" strokeWidth={2.5} />
                        Personal Records
                      </h3>

                      {newPRs.length > 0 && (
                        <div className="mt-4 rounded-[14px] border border-gold/40 bg-gold/[0.08] px-4 py-3 text-[14px] font-bold text-gold">
                          🏆 New Personal Record —{" "}
                          {newPRs.map((p) => `${p.club} ${p.distance}m`).join(", ")}
                        </div>
                      )}

                      <div className="mt-4 space-y-2.5">
                        {driverBest > 0 && (
                          <div className="flex items-center justify-between rounded-[12px] bg-white/[0.03] px-4 py-3">
                            <span className="text-[14px] text-white/70">
                              {driverIsNew ? "🏆 " : ""}Longest Driver
                            </span>
                            <span className="font-display text-[18px] font-extrabold text-gold">
                              {driverBest} m
                            </span>
                          </div>
                        )}
                        {longestIron && (
                          <div className="flex items-center justify-between rounded-[12px] bg-white/[0.03] px-4 py-3">
                            <span className="text-[14px] text-white/70">
                              Longest {longestIron.club}
                            </span>
                            <span className="font-display text-[18px] font-extrabold text-gold">
                              {longestIron.distance} m
                            </span>
                          </div>
                        )}
                        {consistentClub && (
                          <div className="flex items-center justify-between rounded-[12px] bg-white/[0.03] px-4 py-3">
                            <span className="text-[14px] text-white/70">Most Consistent Club</span>
                            <span className="font-display text-[18px] font-extrabold text-gold">
                              {consistentClub.club}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section 3 — AI Coaching Feedback */}
                  <div className="rounded-[18px] border border-gold/40 bg-gold/[0.05] p-6">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">
                        What&apos;s holding you back
                      </span>
                      <span className="rounded-full border border-gold/40 px-3 py-1 font-display text-[12px] font-bold text-gold">
                        Score {report.practiceScore}
                      </span>
                    </div>
                    <h2 className="mt-2 font-display text-[24px] font-extrabold leading-tight tracking-tight">
                      {report.primaryLimitation.title}
                    </h2>
                    <p className="mt-3 text-[15px] leading-relaxed text-white/80">
                      {report.primaryLimitation.explanation}
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-white/15 bg-white/[0.02] p-6">
                    <h3 className="font-display text-[16px] font-bold uppercase tracking-wide text-gold">
                      Coaching Principles
                    </h3>
                    <ul className="mt-4 space-y-3">
                      {report.coachingPrinciples.map((principle, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-[15px] leading-relaxed text-white/85"
                        >
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
                          {principle}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Section 4 — Next Session Goal */}
                  <div className="rounded-[18px] border border-white/15 bg-white/[0.02] p-6">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                      Next session goal
                    </span>
                    <p className="mt-2 font-display text-[20px] font-bold leading-snug tracking-tight text-gold">
                      {report.nextGoal}
                    </p>
                  </div>

                  {/* Section 5 — How Did This Session Feel? */}
                  <div className="rounded-[18px] border border-white/15 bg-white/[0.02] p-6">
                    <h3 className="font-display text-[16px] font-bold uppercase tracking-wide">
                      How did this session feel?
                    </h3>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {FEELINGS.map((f) => {
                        const active = feeling === f.value;
                        return (
                          <button
                            key={f.value}
                            onClick={() => chooseFeeling(f.value)}
                            className={`rounded-[14px] border px-3 py-4 font-display text-[14px] font-bold uppercase tracking-wide transition active:translate-y-px ${
                              active
                                ? "border-gold bg-gold text-ink"
                                : "border-white/15 bg-white/[0.02] text-white hover:border-gold"
                            }`}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                    {feelingSaved && (
                      <p className="mt-3 flex items-center gap-2 text-[13px] text-white/50">
                        <Check className="size-3.5 text-gold" strokeWidth={3} />
                        Saved — we&apos;ll track how you progress.
                      </p>
                    )}
                  </div>

                  {/* Section 6 — Progress */}
                  {progress && (
                    <div className="rounded-[18px] border border-white/15 bg-white/[0.02] p-6">
                      <h3 className="flex items-center gap-2 font-display text-[16px] font-bold uppercase tracking-wide">
                        <TrendingUp className="size-4 text-gold" strokeWidth={2.5} />
                        Your Progress
                      </h3>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-[14px] bg-white/[0.03] px-3 py-4 text-center">
                          <span className="flex items-center justify-center gap-1 font-display text-[26px] font-extrabold leading-none">
                            {progress.streakWeeks}
                            <Flame className="size-5 text-gold" strokeWidth={2.5} />
                          </span>
                          <span className="mt-1.5 block text-[10px] uppercase tracking-[0.14em] text-white/50">
                            Week Streak
                          </span>
                        </div>
                        <div className="rounded-[14px] bg-white/[0.03] px-3 py-4 text-center">
                          <span className="font-display text-[26px] font-extrabold leading-none">
                            {progress.totalSessions}
                          </span>
                          <span className="mt-1.5 block text-[10px] uppercase tracking-[0.14em] text-white/50">
                            Sessions
                          </span>
                        </div>
                        <div className="rounded-[14px] bg-white/[0.03] px-3 py-4 text-center">
                          <span className="font-display text-[26px] font-extrabold leading-none">
                            {progress.totalBalls.toLocaleString()}
                          </span>
                          <span className="mt-1.5 block text-[10px] uppercase tracking-[0.14em] text-white/50">
                            Total Balls
                          </span>
                        </div>
                      </div>
                      <p className="mt-4 text-[12px] leading-snug text-white/40">
                        Handicap goal progress coming soon.
                      </p>
                    </div>
                  )}

                  {/* Section 7 — Share Card */}
                  <div>
                    <button
                      onClick={shareProgress}
                      className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-gold/50 bg-gold/[0.06] px-6 py-4 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-gold transition hover:bg-gold/[0.12] active:translate-y-px"
                    >
                      <Share2 className="size-4" strokeWidth={2.5} />
                      Share Progress
                    </button>
                    {shareError && (
                      <p className="mt-2 text-[13px] text-red-400">{shareError}</p>
                    )}
                  </div>

                  {/* Registration — only after value is delivered */}
                  {user ? (
                    <div className="flex items-center justify-between rounded-[18px] border border-gold/30 bg-gold/[0.04] px-5 py-4">
                      <span className="text-[14px] text-white/70">
                        Saved to{" "}
                        <span className="font-display font-bold text-gold">{user.id}</span>
                      </span>
                      <Check className="size-4 text-gold" strokeWidth={3} />
                    </div>
                  ) : (
                    <SaveProgressCard clientId={getClientId()} onSignedIn={handleSignedIn} />
                  )}

                  {/* Secondary — detailed per-club breakdown */}
                  <details className="rounded-[18px] border border-white/15 bg-white/[0.02] p-6">
                    <summary className="cursor-pointer font-display text-[14px] font-bold uppercase tracking-wide text-white/60 transition hover:text-white">
                      View detailed stats
                    </summary>
                    <div className="mt-4 space-y-3">
                      {Object.entries(computeStats(shots)).map(([club, s]) => (
                        <div
                          key={club}
                          className="rounded-[14px] bg-white/[0.03] p-4"
                        >
                          <div className="flex items-baseline justify-between">
                            <span className="font-display text-[16px] font-extrabold tracking-wide text-gold">
                              {club}
                            </span>
                            <span className="text-[12px] text-white/50">
                              Avg {s.averageDistance}m · Best {s.bestDistance}m
                              {s.outShots > 0 ? ` · ${s.outShots} out` : ""}
                            </span>
                          </div>
                          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-white/10">
                            <div className="bg-white/40" style={{ width: `${s.leftPct}%` }} />
                            <div className="bg-gold" style={{ width: `${s.centerPct}%` }} />
                            <div className="bg-white/40" style={{ width: `${s.rightPct}%` }} />
                          </div>
                          <div className="mt-1 flex justify-between text-[11px] text-white/50">
                            <span>L {s.leftPct}%</span>
                            <span className="text-gold">C {s.centerPct}%</span>
                            <span>R {s.rightPct}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              <button
                onClick={reset}
                className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-white/20 px-6 py-4 font-display text-[13px] font-bold uppercase tracking-[0.14em] transition hover:border-white active:translate-y-px"
              >
                <RotateCcw className="size-3.5" strokeWidth={2.5} />
                Start Over
              </button>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
