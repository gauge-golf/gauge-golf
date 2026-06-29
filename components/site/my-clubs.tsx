"use client";

import { ArrowLeft, Loader2, Target, RefreshCw } from "lucide-react";
import { BAG_CLUBS, mToUnit } from "@/lib/coach-plan";
import type { Unit } from "@/lib/coach-plan";
import type { ClubProfileRecord } from "@/lib/coach";

// Display order (wedges → driver) and full names, sourced from the shared bag.
const CLUB_ORDER = new Map(BAG_CLUBS.map((c, i) => [c.club, i]));
const CLUB_NAME = new Map(BAG_CLUBS.map((c) => [c.club, c.label]));

/** Compact, human "last updated" label, e.g. "today", "3d ago", "2w ago". */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}

type Props = {
  profiles: ClubProfileRecord[];
  unit: Unit;
  loading: boolean;
  onBack: () => void;
  onStartPractice: () => void;
};

/**
 * "My Clubs" — the golfer's personal yardage reference, readable in seconds.
 * One card per club. Reliable distance is the hero (what to actually club for),
 * with average, best, accuracy and dispersion in support. The metric grid is
 * intentionally extensible so future cells (wind-adjusted, recommended carry,
 * partial swings) drop in without a redesign.
 */
export function MyClubs({ profiles, unit, loading, onBack, onStartPractice }: Props) {
  const sorted = [...profiles].sort(
    (a, b) => (CLUB_ORDER.get(a.clubKey) ?? 99) - (CLUB_ORDER.get(b.clubKey) ?? 99)
  );

  return (
    <section className="pb-10">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 font-display text-[12px] font-bold uppercase tracking-[0.14em] text-white/60 transition hover:text-white"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2.5} />
        Back
      </button>

      <h1 className="mt-5 font-display text-[clamp(34px,8vw,56px)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em]">
        My <span className="text-gold">Clubs</span>
      </h1>
      <p className="mt-4 max-w-[42ch] text-base text-white/60">
        How far you actually hit every club — built quietly from your sessions.
        Check it before the first tee.
      </p>

      {loading ? (
        <div className="mt-8 flex items-center gap-3 rounded-[18px] border border-white/15 bg-white/[0.02] px-5 py-4">
          <Loader2 className="size-5 animate-spin text-gold" />
          <span className="font-display text-[15px] font-bold uppercase tracking-wide text-white/60">
            Loading your yardages...
          </span>
        </div>
      ) : sorted.length === 0 ? (
        <div className="mt-8 rounded-[18px] border border-white/15 bg-white/[0.02] p-8 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full border border-gold/40 bg-gold/[0.08] text-gold">
            <Target className="size-6" strokeWidth={2} />
          </span>
          <h2 className="mt-5 font-display text-[20px] font-extrabold uppercase tracking-wide">
            No yardages yet
          </h2>
          <p className="mx-auto mt-2 max-w-[34ch] text-[14px] leading-snug text-white/55">
            Log a driving-range session and we&apos;ll start building your
            personal distances for every club.
          </p>
          <button
            onClick={onStartPractice}
            className="mt-6 inline-flex items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-3.5 font-display text-[13px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px"
          >
            Start Practice
          </button>
        </div>
      ) : (
        <>
          <div className="mt-8 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
              {sorted.length} {sorted.length === 1 ? "Club" : "Clubs"} · {unit === "yd" ? "Yards" : "Metres"}
            </span>
            <button
              onClick={onStartPractice}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-gold/80 transition hover:text-gold"
            >
              <RefreshCw className="size-3" strokeWidth={2.5} />
              Add a session
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {sorted.map((p) => (
              <ClubCard key={p.clubKey} profile={p} unit={unit} />
            ))}
          </div>

          <p className="mt-5 text-[12px] leading-snug text-white/40">
            <span className="text-gold/80">Reliable</span> is your confident
            carry — average minus your shot spread. Club for it on the course.
          </p>
        </>
      )}
    </section>
  );
}

function ClubCard({ profile, unit }: { profile: ClubProfileRecord; unit: Unit }) {
  const name = CLUB_NAME.get(profile.clubKey) ?? profile.clubKey;
  return (
    <div className="rounded-[18px] border border-white/15 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-[12px] border border-gold/40 bg-gold/[0.08] font-display text-[16px] font-extrabold tracking-wide text-gold">
            {profile.clubKey}
          </span>
          <span className="font-display text-[16px] font-bold uppercase tracking-wide">
            {name}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
          {relativeTime(profile.lastUpdated)}
        </span>
      </div>

      {/* Distances — Reliable is the hero. Add future cells here (carry, wind). */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric label="Reliable" value={profile.reliableDist} unit={unit} hero />
        <Metric label="Average" value={profile.avgDistance} unit={unit} />
        <Metric label="Best" value={profile.personalBest} unit={unit} />
      </div>

      {/* Quality signals. Future: partial swings / recommended carry slot in here. */}
      <div className="mt-3 flex gap-3">
        <div className="flex flex-1 items-center justify-between rounded-[12px] bg-white/[0.03] px-4 py-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
            Accuracy
          </span>
          <span className="font-display text-[15px] font-extrabold text-white">
            {profile.accuracy}%
          </span>
        </div>
        <div className="flex flex-1 items-center justify-between rounded-[12px] bg-white/[0.03] px-4 py-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/45">
            Dispersion
          </span>
          <span className="font-display text-[15px] font-extrabold text-white">
            ±{mToUnit(profile.dispersion, unit)} {unit}
          </span>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  hero,
}: {
  label: string;
  value: number;
  unit: Unit;
  hero?: boolean;
}) {
  return (
    <div
      className={`rounded-[12px] px-3 py-3 text-center ${
        hero ? "border border-gold/30 bg-gold/[0.06]" : "bg-white/[0.03]"
      }`}
    >
      <span className="flex items-baseline justify-center gap-0.5">
        <span
          className={`font-display font-extrabold leading-none ${
            hero ? "text-[26px] text-gold" : "text-[22px] text-white"
          }`}
        >
          {mToUnit(value, unit)}
        </span>
        <span className="font-mono text-[10px] uppercase text-white/40">{unit}</span>
      </span>
      <span className="mt-1.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">
        {label}
      </span>
    </div>
  );
}
