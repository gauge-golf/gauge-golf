"use client";

import { useState } from "react";
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
} from "lucide-react";
import { analyzeSession } from "@/app/actions";
import type { CoachReport } from "@/lib/coach";

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
  { key: "warmup", label: "Warm Up", club: "WU", target: 50 },
  { key: "sw", label: "Sand Wedge", club: "SW", target: 60 },
  { key: "pw", label: "Pitching Wedge", club: "PW", target: 90 },
  { key: "i9", label: "9 Iron", club: "9I", target: 110 },
  { key: "i8", label: "8 Iron", club: "8I", target: 125 },
  { key: "i7", label: "7 Iron", club: "7I", target: 140 },
  { key: "i6", label: "6 Iron", club: "6I", target: 155 },
  { key: "i5", label: "5 Iron", club: "5I", target: 170 },
  { key: "driver", label: "Driver", club: "DR", target: 230 },
];

/** Distance result options (m). */
const DISTANCES: number[] = Array.from({ length: 21 }, (_, i) => 30 + i * 5);

/** Direction options. */
const DIRECTIONS = ["Left", "Center", "Right"] as const;
type Direction = (typeof DIRECTIONS)[number];

type Shot = {
  club: string;
  target: number;
  distance: number;
  direction: Direction;
};

/** Hardcoded driving-range plans keyed by ball count. */
const DRIVING_RANGE_PLANS: Record<number, Record<string, number>> = {
  50: { warmup: 5, sw: 5, pw: 5, i9: 5, i8: 5, i7: 5, i6: 5, i5: 5, driver: 10 },
  100: { warmup: 10, sw: 10, pw: 10, i9: 10, i8: 10, i7: 10, i6: 10, i5: 10, driver: 20 },
  150: { warmup: 15, sw: 15, pw: 15, i9: 15, i8: 15, i7: 15, i6: 15, i5: 15, driver: 30 },
  200: { warmup: 20, sw: 20, pw: 20, i9: 20, i8: 20, i7: 20, i6: 20, i5: 20, driver: 40 },
};

function buildPlan(ballCount: number): PlanStep[] {
  const plan = DRIVING_RANGE_PLANS[ballCount];
  if (!plan) return [];
  return STEP_LABELS.map((s) => ({ ...s, balls: plan[s.key] }));
}

const DEFAULT_DIRECTION: Direction = "Center";

/* ───────── Statistics (pure math — no AI / no API) ───────── */

type ClubStats = {
  shots: number;
  averageDistance: number;
  bestDistance: number;
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
    const distances = list.map((s) => s.distance);
    const left = list.filter((s) => s.direction === "Left").length;
    const center = list.filter((s) => s.direction === "Center").length;
    const right = list.filter((s) => s.direction === "Right").length;

    stats[club] = {
      shots: total,
      averageDistance: Math.round(distances.reduce((a, b) => a + b, 0) / total),
      bestDistance: Math.max(...distances),
      leftPct: pct(left, total),
      centerPct: pct(center, total),
      rightPct: pct(right, total),
    };
  }
  return stats;
}

/* ───────── Component ───────── */

export function Coach() {
  const [type, setType] = useState<PracticeType | null>(null);
  const [option, setOption] = useState<{ label: string; value: string | number } | null>(null);
  const [started, setStarted] = useState(false);

  // Session (shot-by-shot logging)
  const [stepIndex, setStepIndex] = useState<number | null>(null); // null = not in session
  const [shotNum, setShotNum] = useState(1); // 1-based within current club
  const [distance, setDistance] = useState<number>(DISTANCES[0]);
  const [direction, setDirection] = useState<Direction>(DEFAULT_DIRECTION);
  const [shots, setShots] = useState<Shot[]>([]);

  // AI report
  const [report, setReport] = useState<CoachReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const result =
    type && option
      ? { practiceType: type.label, [type.optionKey]: option.value }
      : null;

  const plan =
    type?.key === "driving-range" && typeof option?.value === "number"
      ? buildPlan(option.value)
      : [];

  const inSession = stepIndex !== null;
  const currentStep = inSession && plan[stepIndex] ? plan[stepIndex] : null;
  const sessionComplete = inSession && !currentStep;

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
  }

  function saveShot() {
    if (!currentStep || !shot) return;
    setShots((prev) => [...prev, shot]);

    const isLastShotOfClub = shotNum >= currentStep.balls;
    if (isLastShotOfClub) {
      const next = (stepIndex ?? 0) + 1;
      setStepIndex(next);
      setShotNum(1);
      setDistance(plan[next]?.target ?? DISTANCES[0]);
    } else {
      setShotNum((n) => n + 1);
      setDistance(currentStep.target);
    }
    setDirection(DEFAULT_DIRECTION);
  }

  async function requestReport() {
    if (!shots.length) return;
    setLoadingReport(true);
    setReportError(null);

    const stats = computeStats(shots);
    const res = await analyzeSession({ plan, results: shots, stats });

    setLoadingReport(false);
    if (res.ok) {
      setReport(res.report);
    } else {
      setReportError(res.message);
    }
  }

  function reset() {
    setType(null);
    setOption(null);
    setStarted(false);
    setStepIndex(null);
    setShotNum(1);
    setShots([]);
    setReport(null);
    setReportError(null);
  }

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
        </header>

        <div className="flex flex-1 flex-col justify-center py-10">
          {/* STEP 1 — Practice type */}
          {!type && (
            <section>
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

          {/* DONE — confirmation + JSON payload */}
          {result && type && option && !started && (
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

              <pre className="mt-8 overflow-x-auto rounded-[18px] border border-white/15 bg-ink-2 p-5 font-mono text-[13px] leading-relaxed text-gold">
{JSON.stringify(result, null, 2)}
              </pre>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => (plan.length ? setStarted(true) : undefined)}
                  className="inline-flex items-center gap-2.5 rounded-full bg-gold px-6 py-4 font-display text-[13px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px"
                >
                  {plan.length ? "View Plan" : "Start Practice"}
                  <ArrowRight className="size-3.5" strokeWidth={2.5} />
                </button>
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2.5 rounded-full border border-white/20 px-6 py-4 font-display text-[13px] font-bold uppercase tracking-[0.14em] transition hover:border-white active:translate-y-px"
                >
                  <RotateCcw className="size-3.5" strokeWidth={2.5} />
                  Start Over
                </button>
              </div>
            </section>
          )}

          {/* TRAINING PLAN — static, hardcoded cards */}
          {started && !inSession && plan.length > 0 && type && option && (
            <section>
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

              <button
                onClick={startSession}
                className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-4 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px sm:w-auto"
              >
                Start Session
                <ArrowRight className="size-3.5" strokeWidth={2.5} />
              </button>
            </section>
          )}

          {/* SHOT INPUT — log one shot at a time */}
          {inSession && currentStep && shot && (
            <section>
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
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="mt-3 w-full rounded-[14px] border border-white/15 bg-ink-2 px-5 py-4 font-display text-[18px] font-bold tracking-wide text-white outline-none transition focus:border-gold"
                >
                  {DISTANCES.map((d) => (
                    <option key={d} value={d}>
                      {d}m
                    </option>
                  ))}
                </select>
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

              {/* Live result JSON */}
              <pre className="mt-8 overflow-x-auto rounded-[18px] border border-white/15 bg-ink-2 p-5 font-mono text-[13px] leading-relaxed text-gold">
{JSON.stringify(shot, null, 2)}
              </pre>

              <button
                onClick={saveShot}
                className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-4 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px sm:w-auto"
              >
                Save Shot
                <ArrowRight className="size-3.5" strokeWidth={2.5} />
              </button>
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
                {shots.length} shots logged.
              </p>

              {/* Per-club statistics (pure math) */}
              <pre className="mt-8 overflow-x-auto rounded-[18px] border border-white/15 bg-ink-2 p-5 font-mono text-[13px] leading-relaxed text-gold">
{JSON.stringify(computeStats(shots), null, 2)}
              </pre>

              {/* AI Report */}
              {!report && !loadingReport && (
                <button
                  onClick={requestReport}
                  className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-4 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px sm:w-auto"
                >
                  Get AI Analysis
                  <ArrowRight className="size-3.5" strokeWidth={2.5} />
                </button>
              )}

              {loadingReport && (
                <div className="mt-8 flex items-center gap-3 rounded-[18px] border border-white/15 bg-white/[0.02] px-5 py-4">
                  <Loader2 className="size-5 animate-spin text-gold" />
                  <span className="font-display text-[15px] font-bold uppercase tracking-wide text-white/60">
                    Analyzing session...
                  </span>
                </div>
              )}

              {reportError && (
                <div className="mt-8 rounded-[18px] border border-red-500/30 bg-red-500/5 px-5 py-4 text-[14px] text-red-400">
                  {reportError}
                </div>
              )}

              {report && (
                <div className="mt-8 space-y-6">
                  <div className="rounded-[18px] border border-white/15 bg-white/[0.02] p-6">
                    <h2 className="font-display text-[18px] font-bold uppercase tracking-wide text-gold">
                      AI Analysis
                    </h2>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                          Strongest Club
                        </span>
                        <p className="mt-1 font-display text-[20px] font-bold tracking-wide text-gold">
                          {report.strongestClub}
                        </p>
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                          Weakest Club
                        </span>
                        <p className="mt-1 font-display text-[20px] font-bold tracking-wide">
                          {report.weakestClub}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                        Miss Pattern
                      </span>
                      <p className="mt-1 text-[15px] leading-relaxed text-white/80">
                        {report.missPattern}
                      </p>
                    </div>

                    <div className="mt-6">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                        Recommendations
                      </span>
                      <ul className="mt-3 space-y-2">
                        {report.recommendations.map((rec, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-[14px] leading-relaxed text-white/80"
                          >
                            <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold/20 font-mono text-[11px] font-bold text-gold">
                              {i + 1}
                            </span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-white/15 bg-white/[0.02] p-6">
                    <h3 className="font-display text-[16px] font-bold uppercase tracking-wide">
                      Next Session Plan
                    </h3>
                    <pre className="mt-4 overflow-x-auto rounded-[14px] border border-white/10 bg-ink-2 p-4 font-mono text-[12px] leading-relaxed text-gold">
{JSON.stringify(report.nextSessionPlan, null, 2)}
                    </pre>
                  </div>
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
