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
  Trash2,
  RefreshCw,
  LogOut,
  Clock,
  Pencil,
  Cloud,
  History,
  ChevronDown,
  Undo2,
  Minus,
  Plus,
  X,
} from "lucide-react";
import {
  analyzeSession,
  saveSession,
  updateSessionFeeling,
  getCoachProgress,
  getCurrentUser,
  signOut,
  generateAdaptivePlan,
  resetMyData,
  setDisplayName,
  getSessionHistory,
} from "@/app/actions";
import type {
  CoachReport,
  SessionFeeling,
  CoachProgress,
  ClubStatRecord,
  SessionHistoryItem,
} from "@/lib/coach";
import type { AuthUser } from "@/lib/auth";
import { SaveProgressCard } from "./coach-auth";
import {
  BAG_CLUBS,
  OUT,
  DIRECTIONS,
  DEFAULT_DIRECTION,
  DEFAULT_UNIT,
  FEELINGS,
  distancePresets,
  mToUnit,
  unitToM,
  fmtDist,
  locateShot,
  clubAbbr,
  buildDrivingRangePlan,
  buildWarmUpPlan,
  buildHandicapPlan,
  buildFixMissPlan,
  planStepsFromCounts,
  formatDuration,
  computeStats,
  mostConsistentClub,
} from "@/lib/coach-plan";
import type {
  PlanStep,
  Unit,
  Direction,
  Shot,
} from "@/lib/coach-plan";
import { getClientId } from "@/lib/client-id";
import { fetchWeather, getCurrentPosition } from "@/lib/weather";
import type { SessionWeather } from "@/lib/weather";

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

// Domain logic (plan builders, shot/stat model, statistics) lives in
// @/lib/coach-plan. The anonymous device id lives in @/lib/client-id.
// This component is a thin orchestrator over those pure modules.

/* ───────── Component ───────── */

export function Coach() {
  const [type, setType] = useState<PracticeType | null>(null);
  const [option, setOption] = useState<{ label: string; value: string | number } | null>(null);
  const [started, setStarted] = useState(false);

  // My Bag — clubs the user actually owns (defaults to all).
  const [bag, setBag] = useState<string[]>(BAG_CLUBS.map((c) => c.key));

  // Display unit (yards by default; metres available in Settings). Display-only
  // — every distance is always stored in metres.
  const [unit, setUnit] = useState<Unit>(DEFAULT_UNIT);

  // Session (shot-by-shot logging). The current position is DERIVED from
  // shots.length, so a shot can never be accidentally skipped and Undo simply
  // drops the last entry.
  const [inSession, setInSession] = useState(false);
  const [distanceField, setDistanceField] = useState(""); // display-unit text
  const [isOut, setIsOut] = useState(false);
  const [direction, setDirection] = useState<Direction>(DEFAULT_DIRECTION);
  const [shots, setShots] = useState<Shot[]>([]);

  // Editing a previously logged shot (null = closed).
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editField, setEditField] = useState("");
  const [editIsOut, setEditIsOut] = useState(false);
  const [editDirection, setEditDirection] = useState<Direction>(DEFAULT_DIRECTION);

  // Session timing
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [durationSecs, setDurationSecs] = useState(0);
  const [nowTick, setNowTick] = useState(0); // drives the live timer (1s ticks)

  // Weather snapshot captured at session start (Open-Meteo). null = unavailable.
  const [weather, setWeather] = useState<SessionWeather | null>(null);

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

  // AI adaptive plan (returning signed-in users only)
  const [aiPlan, setAiPlan] = useState<PlanStep[] | null>(null);
  const [aiFocusNote, setAiFocusNote] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Data reset (clean slate — useful for testing)
  const [resetting, setResetting] = useState(false);

  // Manual refresh of the signed-in user + dashboard
  const [refreshing, setRefreshing] = useState(false);

  // Editable display name
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Past sessions (lazy-loaded history)
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);

  // Persisted display unit.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("gg_unit");
    if (saved === "yd" || saved === "m") setUnit(saved);
  }, []);

  function changeUnit(next: Unit) {
    setUnit(next);
    if (typeof window !== "undefined") localStorage.setItem("gg_unit", next);
  }

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

  async function handleRefresh() {
    setRefreshing(true);
    const u = await getCurrentUser();
    setUser(u);
    if (u) {
      const prog = await getCoachProgress(
        getClientId(),
        savedSessionId ?? undefined,
        u.id
      );
      setDashboard(prog);
      setProgress(prog);
    }
    setHistory([]);
    setRefreshing(false);
  }

  async function toggleHistory() {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next && history.length === 0) {
      setHistoryLoading(true);
      const rows = await getSessionHistory(getClientId(), user?.id);
      setHistory(rows);
      setHistoryLoading(false);
    }
  }

  function startEditName() {
    setNameDraft(user?.displayName ?? "");
    setEditingName(true);
  }

  async function saveName() {
    if (!user) return;
    setSavingName(true);
    const res = await setDisplayName(nameDraft);
    setSavingName(false);
    if (res.ok) {
      setUser({ ...user, displayName: res.displayName });
      setEditingName(false);
    }
  }

  async function handleResetData() {
    const ok = window.confirm(
      "Delete all your training history and start from zero? This can't be undone."
    );
    if (!ok) return;

    setResetting(true);
    const clientId = getClientId();
    await resetMyData(clientId);

    // Start the anonymous device fresh so old sessions can't reattach.
    if (typeof window !== "undefined") {
      localStorage.removeItem("gg_coach_client_id");
    }

    setDashboard(null);
    setProgress(null);
    setHistory([]);
    setHistoryOpen(false);
    setResetting(false);
  }

  const result =
    type && option
      ? { practiceType: type.label, [type.optionKey]: option.value }
      : null;

  // Hardcoded adaptive plan — the single source of truth for eligible clubs
  // and total ball count. Used directly for first-time / anonymous players.
  const basePlan = (() => {
    if (!type || !option) return [];

    switch (type.key) {
      case "driving-range":
        return typeof option.value === "number"
          ? buildDrivingRangePlan(option.value, bag)
          : [];
      case "warm-up":
        return typeof option.value === "number"
          ? buildWarmUpPlan(option.value, bag)
          : [];
      case "handicap":
        return typeof option.value === "string"
          ? buildHandicapPlan(option.value, bag)
          : [];
      case "fix-miss":
        return typeof option.value === "string"
          ? buildFixMissPlan(option.value, bag)
          : [];
      default:
        return [];
    }
  })();

  // For returning signed-in users we override with an AI plan (set in
  // startSession); everyone else uses the hardcoded base plan.
  const plan = aiPlan ?? basePlan;

  const pos = inSession ? locateShot(plan, shots.length) : null;
  const stepIndex = pos?.stepIndex ?? null;
  const shotNum = pos?.shotNum ?? 1;
  const currentStep = pos ? plan[pos.stepIndex] : null;
  const sessionComplete = inSession && pos === null;

  // Live session timer — ticks every second while the session is in progress.
  const sessionRunning = inSession && !sessionComplete && startedAt !== null;
  useEffect(() => {
    if (!sessionRunning) return;
    setNowTick(Date.now());
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [sessionRunning]);

  // Seconds to display: live while running, frozen total once complete.
  const liveSecs =
    sessionRunning && startedAt
      ? Math.max(0, Math.round((nowTick - startedAt) / 1000))
      : durationSecs;

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

  // Parse the manual distance field (display units) and build the live shot.
  const fieldNum = parseInt(distanceField, 10);
  const fieldValid = Number.isFinite(fieldNum) && fieldNum > 0;
  const canSave = !!currentStep && (isOut || fieldValid);

  // Live shot object — distance is always stored in metres.
  const shot: Shot | null = currentStep
    ? {
        club: currentStep.club,
        target: currentStep.target,
        distance: isOut ? OUT : unitToM(fieldValid ? fieldNum : 0, unit),
        direction,
      }
    : null;

  async function startSession() {
    if (!basePlan.length || !type || !option) return;

    // Capture weather in the background (don't block the session on it).
    setWeather(null);
    void (async () => {
      const pos = await getCurrentPosition();
      if (!pos) return;
      const w = await fetchWeather(pos.lat, pos.lon);
      if (w) setWeather(w);
    })();

    let effective = basePlan;

    // AI adaptive plan: only for verified, returning users (>=1 past session).
    // Everyone else (first-timers / anonymous) uses the hardcoded base plan.
    const hasHistory = !!user && (dashboard?.totalSessions ?? 0) >= 1;
    if (hasHistory) {
      setPlanLoading(true);
      const totalBalls = basePlan.reduce((acc, s) => acc + s.balls, 0);
      const clubs = basePlan.map((s) => s.key);
      const res = await generateAdaptivePlan({
        practiceType: type.label,
        goal:
          typeof option.value === "string"
            ? option.value
            : String(option.value),
        totalBalls,
        clubs,
      });
      if (res.ok) {
        effective = planStepsFromCounts(res.plan);
        setAiPlan(effective);
        setAiFocusNote(res.focusNote);
      } else {
        setAiPlan(null);
        setAiFocusNote(null);
      }
      setPlanLoading(false);
    } else {
      setAiPlan(null);
      setAiFocusNote(null);
    }

    setShots([]);
    setInSession(true);
    setDistanceField(String(mToUnit(effective[0].target, unit)));
    setIsOut(false);
    setDirection(DEFAULT_DIRECTION);
    setStartedAt(Date.now());
    setDurationSecs(0);
  }

  function saveShot() {
    if (!currentStep || !shot || !canSave) return;
    const nextCount = shots.length + 1;
    setShots((prev) => [...prev, shot]);

    const nextPos = locateShot(plan, nextCount);
    if (!nextPos) {
      // Last shot of the last club ends the session — freeze its duration.
      if (startedAt) setDurationSecs(Math.round((Date.now() - startedAt) / 1000));
    } else {
      setDistanceField(String(mToUnit(plan[nextPos.stepIndex].target, unit)));
    }
    setIsOut(false);
    setDirection(DEFAULT_DIRECTION);
  }

  /** Remove the last shot and pre-fill the editor with it for quick re-logging. */
  function undoLastShot() {
    if (!shots.length) return;
    const last = shots[shots.length - 1];
    setShots((prev) => prev.slice(0, -1));
    setIsOut(last.distance === OUT);
    setDistanceField(
      String(mToUnit(last.distance === OUT ? last.target : last.distance, unit))
    );
    setDirection(last.direction);
  }

  function openEditShot(index: number) {
    const s = shots[index];
    if (!s) return;
    setEditIndex(index);
    setEditIsOut(s.distance === OUT);
    setEditField(String(mToUnit(s.distance === OUT ? s.target : s.distance, unit)));
    setEditDirection(s.direction);
  }

  function saveEditShot() {
    if (editIndex === null) return;
    const n = parseInt(editField, 10);
    const valid = Number.isFinite(n) && n > 0;
    if (!editIsOut && !valid) return;
    setShots((prev) =>
      prev.map((s, i) =>
        i === editIndex
          ? {
              ...s,
              distance: editIsOut ? OUT : unitToM(n, unit),
              direction: editDirection,
            }
          : s
      )
    );
    setEditIndex(null);
  }

  function deleteEditShot() {
    if (editIndex === null) return;
    setShots((prev) => prev.filter((_, i) => i !== editIndex));
    setEditIndex(null);
  }

  /** Nudge the manual distance by ±5 display units (never below 5). */
  function adjustDistance(delta: number) {
    setIsOut(false);
    const base = fieldValid ? fieldNum : mToUnit(currentStep?.target ?? 0, unit);
    setDistanceField(String(Math.max(5, base + delta)));
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
      weather,
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

      // Golfer name (top-right)
      ctx.textAlign = "right";
      ctx.fillStyle = white;
      ctx.font = "700 28px Arial, sans-serif";
      ctx.fillText(user?.displayName ?? user?.id ?? "Guest", W - 96, 150);
      ctx.textAlign = "left";

      // Headline
      ctx.fillStyle = white;
      ctx.font = "800 96px Arial, sans-serif";
      ctx.fillText(`${shots.length}`, 96, 360);
      ctx.fillStyle = muted;
      ctx.font = "700 32px Arial, sans-serif";
      ctx.fillText("BALLS HIT THIS SESSION", 96, 410);

      // Stat rows
      const rows: [string, string][] = [
        ["Session Time", formatDuration(durationSecs)],
        ["Longest Driver", driverBest ? fmtDist(driverBest, unit) : "—"],
        ["Most Consistent", mostConsistent ? mostConsistent.club : "—"],
        ["Current Streak", `${progress?.streakWeeks ?? 0} wk`],
        ["Total Balls Hit", `${(progress?.totalBalls ?? shots.length).toLocaleString()}`],
      ];
      let y = 500;
      for (const [label, value] of rows) {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(96, y, W - 192, 108);
        ctx.fillStyle = muted;
        ctx.font = "600 28px Arial, sans-serif";
        ctx.fillText(label.toUpperCase(), 128, y + 46);
        ctx.fillStyle = gold;
        ctx.textAlign = "right";
        ctx.font = "800 52px Arial, sans-serif";
        ctx.fillText(value, W - 128, y + 72);
        ctx.textAlign = "left";
        y += 132;
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
    setInSession(false);
    setShots([]);
    setDistanceField("");
    setIsOut(false);
    setEditIndex(null);
    setStartedAt(null);
    setDurationSecs(0);
    setWeather(null);
    setReport(null);
    setReportError(null);
    setFeeling(null);
    setFeelingSaved(false);
    setSavedSessionId(null);
    setProgress(null);
    setShareError(null);
    setHistory([]);
    setHistoryOpen(false);
    setAiPlan(null);
    setAiFocusNote(null);
    setPlanLoading(false);
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
            {sessionRunning && (
              <span className="flex items-center gap-1.5 border-l border-white/15 pl-3 tabular-nums text-gold">
                <Clock className="size-3" strokeWidth={2.5} />
                {formatDuration(liveSecs)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {((type && !result) || started) && (
              <button
                onClick={() =>
                  inSession
                    ? setInSession(false)
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
              <>
                {editingName ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/[0.06] py-1 pl-3 pr-1">
                    <input
                      autoFocus
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value.slice(0, 40))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveName();
                        if (e.key === "Escape") setEditingName(false);
                      }}
                      placeholder={user.id}
                      className="w-28 bg-transparent font-display text-[12px] font-bold tracking-wide text-white outline-none placeholder:text-white/30"
                    />
                    <button
                      onClick={saveName}
                      disabled={savingName}
                      aria-label="Save name"
                      className="inline-flex size-6 items-center justify-center rounded-full bg-gold text-ink transition disabled:opacity-50"
                    >
                      {savingName ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Check className="size-3" strokeWidth={3} />
                      )}
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={startEditName}
                    title="Edit name"
                    aria-label="Edit name"
                    className="group inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/[0.06] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold transition hover:bg-gold/[0.12]"
                  >
                    {user.displayName ?? user.id}
                    <Pencil
                      className="size-3 opacity-50 transition group-hover:opacity-100"
                      strokeWidth={2.5}
                    />
                  </button>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  title="Refresh"
                  aria-label="Refresh"
                  className="inline-flex size-8 items-center justify-center rounded-full border border-white/20 text-white/60 transition hover:text-white disabled:opacity-50"
                >
                  <RefreshCw
                    className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
                    strokeWidth={2.5}
                  />
                </button>
                <button
                  onClick={handleSignOut}
                  title="Log out"
                  aria-label="Log out"
                  className="inline-flex size-8 items-center justify-center rounded-full border border-white/20 text-white/60 transition hover:text-white"
                >
                  <LogOut className="size-3.5" strokeWidth={2.5} />
                </button>
              </>
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
                    <span className="font-display text-[13px] font-bold text-gold">{user.displayName ?? user.id}</span>
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
                            {fmtDist(dashboard.recordsByClub["DR"], unit)}
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

                  {/* Past sessions — lazy-loaded on open */}
                  <button
                    onClick={toggleHistory}
                    className="mt-4 flex w-full items-center justify-between rounded-[12px] bg-white/[0.04] px-4 py-3 text-left transition hover:bg-white/[0.06]"
                  >
                    <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-white/70">
                      <History className="size-3.5 text-gold" strokeWidth={2.5} />
                      Past Sessions
                    </span>
                    <ChevronDown
                      className={`size-4 text-white/50 transition ${historyOpen ? "rotate-180" : ""}`}
                      strokeWidth={2.5}
                    />
                  </button>

                  {historyOpen && (
                    <div className="mt-3 space-y-2">
                      {historyLoading ? (
                        <div className="flex items-center gap-2 px-1 py-2 text-[12px] text-white/50">
                          <Loader2 className="size-4 animate-spin text-gold" />
                          Loading your sessions...
                        </div>
                      ) : history.length === 0 ? (
                        <p className="px-1 py-2 text-[12px] text-white/45">
                          No saved sessions yet.
                        </p>
                      ) : (
                        history.map((s) => (
                          <div
                            key={s.id}
                            className="rounded-[12px] border border-white/10 bg-white/[0.02] px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[12px] font-bold text-white/80">
                                {new Date(s.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              {s.practiceScore != null && (
                                <span className="shrink-0 rounded-full border border-gold/30 bg-gold/[0.08] px-2 py-0.5 font-mono text-[10px] font-bold text-gold">
                                  {s.practiceScore}/100
                                </span>
                              )}
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/50">
                              <span>{s.practiceType ?? "Session"}</span>
                              <span>{s.totalBalls} balls</span>
                              <span>{formatDuration(s.durationSecs)}</span>
                              {s.clubsPracticed != null && (
                                <span>{s.clubsPracticed} clubs</span>
                              )}
                            </div>
                            {s.primaryLimitation && (
                              <p className="mt-1.5 text-[12px] text-white/70">
                                <span className="text-white/40">Focus: </span>
                                {s.primaryLimitation}
                              </p>
                            )}
                            {s.nextGoal && (
                              <p className="mt-1 text-[12px] text-white/60">
                                <span className="text-white/40">Next: </span>
                                {s.nextGoal}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleResetData}
                    disabled={resetting}
                    className="mt-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-white/35 transition hover:text-red-400 disabled:opacity-50"
                  >
                    {resetting ? (
                      <Loader2 className="size-3 animate-spin" strokeWidth={2.5} />
                    ) : (
                      <Trash2 className="size-3" strokeWidth={2.5} />
                    )}
                    Reset Data
                  </button>
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
                  const comingSoon = p.key !== "driving-range";
                  return (
                    <button
                      key={p.key}
                      onClick={() => setType(p)}
                      disabled={comingSoon}
                      aria-disabled={comingSoon}
                      className={`group flex items-start gap-4 rounded-[18px] border p-5 text-left transition ${
                        comingSoon
                          ? "cursor-not-allowed border-white/10 bg-white/[0.01] opacity-50"
                          : "border-white/15 bg-white/[0.02] hover:border-gold hover:bg-white/[0.04] active:translate-y-px"
                      }`}
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] border border-white/15 bg-ink-3 text-gold transition group-hover:border-gold/50">
                        <Icon className="size-5" strokeWidth={2} />
                      </span>
                      <span className="flex flex-col">
                        <span className="flex items-center gap-2">
                          <span className="font-display text-[17px] font-bold leading-tight tracking-wide">
                            {p.title}
                          </span>
                          {comingSoon && (
                            <span className="rounded-full border border-gold/30 bg-gold/[0.08] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-gold">
                              Coming Soon
                            </span>
                          )}
                        </span>
                        <span className="mt-1 text-[13px] leading-snug text-white/50">
                          {p.desc}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Units — yards by default, metres optional. Saved on device. */}
              <div className="mt-8 flex items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
                  Distance Units
                </span>
                <div className="inline-flex rounded-full border border-white/15 bg-white/[0.02] p-0.5">
                  {(["yd", "m"] as Unit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => changeUnit(u)}
                      className={`rounded-full px-4 py-1.5 font-display text-[12px] font-bold uppercase tracking-[0.12em] transition ${
                        unit === u
                          ? "bg-gold text-ink"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      {u === "yd" ? "Yards" : "Metres"}
                    </button>
                  ))}
                </div>
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
                    disabled={planLoading}
                    className="flex w-full items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-4 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px disabled:opacity-70"
                  >
                    {planLoading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" strokeWidth={2.5} />
                        Building Your Plan
                      </>
                    ) : (
                      <>
                        Start Session
                        <ArrowRight className="size-3.5" strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* SHOT INPUT — log one shot at a time */}
          {inSession && currentStep && shot && (
            <section className="pb-28">
              {/* AI coach focus note (returning users only) */}
              {aiFocusNote && (
                <div className="mb-6 flex items-start gap-2.5 rounded-[18px] border border-gold/30 bg-gold/[0.06] p-4">
                  <Crosshair className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={2.5} />
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/80">
                      Today&apos;s Focus
                    </span>
                    <p className="mt-1 text-sm text-white/80">{aiFocusNote}</p>
                  </div>
                </div>
              )}

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
                    {fmtDist(currentStep.target, unit)}
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

              {/* Input 1 — Distance Result (manual entry + presets, yards/metres) */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                    Distance
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">
                    {unit === "yd" ? "Yards" : "Metres"}
                  </span>
                </div>

                {/* Stepper + manual numeric entry (opens numeric keyboard) */}
                <div className={`mt-3 flex items-stretch gap-3 ${isOut ? "opacity-40" : ""}`}>
                  <button
                    type="button"
                    onClick={() => adjustDistance(-5)}
                    disabled={isOut}
                    aria-label="Decrease distance"
                    className="flex size-[58px] shrink-0 items-center justify-center rounded-[14px] border border-white/15 bg-white/[0.02] text-white transition hover:border-gold active:translate-y-px disabled:opacity-40"
                  >
                    <Minus className="size-5" strokeWidth={2.5} />
                  </button>
                  <div className="relative flex-1">
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={distanceField}
                      onChange={(e) => {
                        setIsOut(false);
                        setDistanceField(e.target.value.replace(/[^0-9]/g, "").slice(0, 3));
                      }}
                      onFocus={(e) => e.currentTarget.select()}
                      disabled={isOut}
                      aria-label="Distance result"
                      className="h-full w-full rounded-[14px] border border-white/15 bg-ink-2 px-5 text-center font-display text-[34px] font-extrabold tracking-wide text-white outline-none transition focus:border-gold disabled:cursor-not-allowed"
                    />
                    <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 font-mono text-[12px] uppercase tracking-[0.16em] text-white/30">
                      {unit}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustDistance(5)}
                    disabled={isOut}
                    aria-label="Increase distance"
                    className="flex size-[58px] shrink-0 items-center justify-center rounded-[14px] border border-white/15 bg-white/[0.02] text-white transition hover:border-gold active:translate-y-px disabled:opacity-40"
                  >
                    <Plus className="size-5" strokeWidth={2.5} />
                  </button>
                </div>

                {/* Quick presets (display units) */}
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {distancePresets(currentStep.target, unit).map((d) => {
                    const active = !isOut && fieldValid && fieldNum === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setIsOut(false);
                          setDistanceField(String(d));
                        }}
                        className={`rounded-[12px] border py-3 font-display text-[15px] font-bold tracking-wide transition active:translate-y-px ${
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

                {/* Out / Missed toggle */}
                <button
                  type="button"
                  onClick={() => setIsOut((v) => !v)}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] border py-3 font-display text-[13px] font-bold uppercase tracking-[0.14em] transition active:translate-y-px ${
                    isOut
                      ? "border-gold bg-gold text-ink"
                      : "border-white/15 bg-white/[0.02] text-white/70 hover:border-gold"
                  }`}
                >
                  {isOut && <Check className="size-3.5" strokeWidth={3} />}
                  Out / Missed
                </button>
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

              {/* Recent shots — tap any to edit or delete it */}
              {shots.length > 0 && (
                <div className="mt-8">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                    Logged · {shots.length}
                  </span>
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {[...shots.keys()].reverse().map((i) => {
                      const s = shots[i];
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => openEditShot(i)}
                          className="flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-3 py-2 transition hover:border-gold active:translate-y-px"
                        >
                          <span className="font-display text-[11px] font-bold tracking-wide text-white/45">
                            {s.club}
                          </span>
                          <span className="font-display text-[14px] font-extrabold tracking-wide">
                            {s.distance === OUT ? "Out" : mToUnit(s.distance, unit)}
                          </span>
                          <span
                            className={`size-1.5 rounded-full ${
                              s.direction === "Center" ? "bg-gold" : "bg-white/40"
                            }`}
                          />
                          <Pencil className="size-3 text-white/30" strokeWidth={2.5} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fixed bottom action bar — Undo + Save */}
              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-ink/95 px-6 py-4 backdrop-blur">
                <div className="mx-auto flex max-w-[640px] items-center gap-3">
                  <button
                    type="button"
                    onClick={undoLastShot}
                    disabled={!shots.length}
                    aria-label="Undo last shot"
                    className="flex size-[56px] shrink-0 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:border-white hover:text-white active:translate-y-px disabled:opacity-30"
                  >
                    <Undo2 className="size-5" strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={saveShot}
                    disabled={!canSave}
                    className="flex flex-1 items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-4 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px disabled:opacity-40"
                  >
                    {shotButtonLabel}
                    {!isLastShotOfClub && <ArrowRight className="size-3.5" strokeWidth={2.5} />}
                  </button>
                </div>
              </div>

              {/* Edit-shot modal — edit or delete any previous shot */}
              {editIndex !== null && shots[editIndex] && (
                <div
                  className="fixed inset-0 z-30 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6"
                  onClick={() => setEditIndex(null)}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-[480px] rounded-t-[24px] border border-white/10 bg-ink-2 p-6 sm:rounded-[24px]"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-[18px] font-extrabold uppercase tracking-wide">
                        Edit Shot ·{" "}
                        <span className="text-gold">{shots[editIndex].club}</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditIndex(null)}
                        aria-label="Close"
                        className="inline-flex size-8 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:text-white"
                      >
                        <X className="size-4" strokeWidth={2.5} />
                      </button>
                    </div>

                    <div className={`relative mt-5 ${editIsOut ? "opacity-40" : ""}`}>
                      <input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        disabled={editIsOut}
                        value={editField}
                        onChange={(e) =>
                          setEditField(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))
                        }
                        onFocus={(e) => e.currentTarget.select()}
                        aria-label="Distance result"
                        className="w-full rounded-[14px] border border-white/15 bg-ink px-5 py-4 text-center font-display text-[30px] font-extrabold tracking-wide text-white outline-none transition focus:border-gold disabled:cursor-not-allowed"
                      />
                      <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 font-mono text-[12px] uppercase tracking-[0.16em] text-white/30">
                        {unit}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditIsOut((v) => !v)}
                      className={`mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] border py-3 font-display text-[13px] font-bold uppercase tracking-[0.14em] transition ${
                        editIsOut
                          ? "border-gold bg-gold text-ink"
                          : "border-white/15 bg-white/[0.02] text-white/70 hover:border-gold"
                      }`}
                    >
                      {editIsOut && <Check className="size-3.5" strokeWidth={3} />}
                      Out / Missed
                    </button>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {DIRECTIONS.map((d) => {
                        const active = editDirection === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setEditDirection(d)}
                            className={`rounded-[14px] border px-3 py-3 font-display text-[14px] font-bold uppercase tracking-wide transition ${
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

                    <div className="mt-6 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={deleteEditShot}
                        aria-label="Delete shot"
                        className="inline-flex size-[52px] shrink-0 items-center justify-center rounded-full border border-white/20 text-white/60 transition hover:border-red-400 hover:text-red-400 active:translate-y-px"
                      >
                        <Trash2 className="size-4" strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        onClick={saveEditShot}
                        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gold px-6 py-4 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px"
                      >
                        <Check className="size-4" strokeWidth={3} />
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
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

              {/* Conditions — captured at session start (impacts ball flight) */}
              {weather && (
                <div className="mt-6">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                    <Cloud className="size-3" strokeWidth={2.5} />
                    Conditions
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(
                      [
                        ["Temp", `${weather.tempC}°C`],
                        ["Feels", `${weather.apparentC}°C`],
                        ["Wind", `${weather.windKmh} km/h ${weather.windDir}`],
                        ["Precip", `${weather.precipMm} mm`],
                        ["Humidity", `${weather.humidityPct}%`],
                        ["Pressure", `${weather.pressureHpa} hPa`],
                        ["UV", `${weather.uvIndex} ${weather.uvLabel}`],
                      ] as [string, string][]
                    ).map(([k, v]) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.02] px-3 py-1.5 text-[11px]"
                      >
                        <span className="uppercase tracking-[0.1em] text-white/35">{k}</span>
                        <span className="font-display font-bold text-white/80">{v}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                          {newPRs.map((p) => `${p.club} ${fmtDist(p.distance, unit)}`).join(", ")}
                        </div>
                      )}

                      <div className="mt-4 space-y-2.5">
                        {driverBest > 0 && (
                          <div className="flex items-center justify-between rounded-[12px] bg-white/[0.03] px-4 py-3">
                            <span className="text-[14px] text-white/70">
                              {driverIsNew ? "🏆 " : ""}Longest Driver
                            </span>
                            <span className="font-display text-[18px] font-extrabold text-gold">
                              {fmtDist(driverBest, unit)}
                            </span>
                          </div>
                        )}
                        {longestIron && (
                          <div className="flex items-center justify-between rounded-[12px] bg-white/[0.03] px-4 py-3">
                            <span className="text-[14px] text-white/70">
                              Longest {longestIron.club}
                            </span>
                            <span className="font-display text-[18px] font-extrabold text-gold">
                              {fmtDist(longestIron.distance, unit)}
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
                        <span className="font-display font-bold text-gold">{user.displayName ?? user.id}</span>
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
                              Avg {fmtDist(s.averageDistance, unit)} · Best {fmtDist(s.bestDistance, unit)}
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
