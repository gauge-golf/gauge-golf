"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2, Mail } from "lucide-react";
import { requestOtp, verifyOtp, setUserGoal } from "@/app/actions";
import type { AuthUser, PlayerGoal } from "@/lib/auth";
import { GOAL_OPTIONS } from "@/lib/auth";

type Step = "intro" | "email" | "otp" | "goal" | "done";

const BENEFITS = [
  "Remember every session",
  "Track personal records",
  "Keep your AI coaching history",
  "See your training progress",
];

/**
 * Post-value registration card (email + OTP, no password).
 * Shown only after the coaching report is delivered.
 */
export function SaveProgressCard({
  clientId,
  onSignedIn,
}: {
  clientId: string;
  onSignedIn: (user: AuthUser, isNew: boolean) => void;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ user: AuthUser; isNew: boolean } | null>(null);

  // Goal step (profile-level, asked once)
  const [goal, setGoal] = useState<PlayerGoal | null>(null);
  const [targetHcp, setTargetHcp] = useState("");

  async function sendCode() {
    setBusy(true);
    setError(null);
    const res = await requestOtp(email);
    setBusy(false);
    if (res.ok) {
      setStep("otp");
    } else {
      setError(res.message);
    }
  }

  async function confirmCode() {
    setBusy(true);
    setError(null);
    const res = await verifyOtp(email, code, clientId);
    setBusy(false);
    if (res.ok && res.user) {
      setResult({ user: res.user, isNew: !!res.isNew });
      onSignedIn(res.user, !!res.isNew);
      // Ask for the player's goal once (new users, or anyone missing one).
      if (res.isNew || !res.user.goal) {
        setStep("goal");
      } else {
        setStep("done");
      }
    } else {
      setError(res.message);
    }
  }

  async function saveGoal() {
    if (!goal) return;
    setBusy(true);
    const th = goal === "lower_handicap" && targetHcp ? Number(targetHcp) : null;
    await setUserGoal(goal, th);
    setBusy(false);
    setStep("done");
  }

  if (step === "done" && result) {
    return (
      <div className="rounded-[18px] border border-gold/40 bg-gold/[0.06] p-6">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-gold text-ink">
          <Check className="size-6" strokeWidth={3} />
        </span>
        <h3 className="mt-4 font-display text-[20px] font-extrabold tracking-tight">
          {result.isNew ? "You're all set." : "Welcome back."}
        </h3>
        <p className="mt-2 text-[14px] text-white/70">
          Signed in as{" "}
          <span className="font-display font-bold text-gold">{result.user.id}</span>. Your
          progress is saved — we&apos;ll remember you next time.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-white/15 bg-white/[0.02] p-6">
      <h3 className="font-display text-[18px] font-extrabold tracking-tight">
        Save your progress?
      </h3>

      {step === "intro" && (
        <>
          <ul className="mt-4 space-y-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-[14px] text-white/80">
                <Check className="size-4 shrink-0 text-gold" strokeWidth={3} />
                {b}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setStep("email")}
            className="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-4 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px"
          >
            <Mail className="size-4" strokeWidth={2.5} />
            Continue with Email
          </button>
          <p className="mt-3 text-center text-[12px] text-white/40">
            No password. One field, one code — about 15 seconds.
          </p>
        </>
      )}

      {step === "email" && (
        <div className="mt-4">
          <label
            htmlFor="auth-email"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40"
          >
            Email address
          </label>
          <input
            id="auth-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && email && !busy && sendCode()}
            placeholder="you@example.com"
            className="mt-3 w-full rounded-[14px] border border-white/15 bg-ink-2 px-5 py-4 font-display text-[16px] tracking-wide text-white outline-none transition focus:border-gold"
          />
          {error && <p className="mt-2 text-[13px] text-red-400">{error}</p>}
          <button
            onClick={sendCode}
            disabled={busy || !email}
            className="mt-4 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-4 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px disabled:opacity-40"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Continue"}
            {!busy && <ArrowRight className="size-3.5" strokeWidth={2.5} />}
          </button>
        </div>
      )}

      {step === "otp" && (
        <div className="mt-4">
          <p className="text-[14px] text-white/70">
            We emailed a 6-digit code to{" "}
            <span className="font-bold text-white">{email}</span>.
          </p>
          <input
            id="auth-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && code.length === 6 && !busy && confirmCode()}
            placeholder="••••••"
            className="mt-3 w-full rounded-[14px] border border-white/15 bg-ink-2 px-5 py-4 text-center font-display text-[28px] font-extrabold tracking-[0.4em] text-white outline-none transition focus:border-gold"
          />
          {error && <p className="mt-2 text-[13px] text-red-400">{error}</p>}
          <button
            onClick={confirmCode}
            disabled={busy || code.length !== 6}
            className="mt-4 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-4 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px disabled:opacity-40"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Verify"}
          </button>
          <button
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="mt-3 w-full text-center text-[12px] text-white/40 transition hover:text-white/70"
          >
            Use a different email
          </button>
        </div>
      )}

      {step === "goal" && (
        <div className="mt-4">
          <p className="text-[14px] text-white/70">
            What are you mainly training for? We&apos;ll tailor every plan to this.
          </p>
          <div className="mt-4 space-y-2">
            {GOAL_OPTIONS.map((g) => {
              const active = goal === g.value;
              return (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={`flex w-full items-start gap-3 rounded-[14px] border px-4 py-3 text-left transition ${
                    active
                      ? "border-gold bg-gold/[0.08]"
                      : "border-white/15 bg-white/[0.02] hover:border-white/30"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                      active ? "border-gold bg-gold text-ink" : "border-white/30"
                    }`}
                  >
                    {active && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span>
                    <span className="block font-display text-[14px] font-bold">
                      {g.label}
                    </span>
                    <span className="block text-[12px] text-white/50">
                      {g.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {goal === "lower_handicap" && (
            <div className="mt-3">
              <label
                htmlFor="target-hcp"
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40"
              >
                Target handicap (optional)
              </label>
              <input
                id="target-hcp"
                inputMode="numeric"
                value={targetHcp}
                onChange={(e) => setTargetHcp(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="10"
                className="mt-2 w-full rounded-[14px] border border-white/15 bg-ink-2 px-5 py-3 font-display text-[16px] tracking-wide text-white outline-none transition focus:border-gold"
              />
            </div>
          )}

          <button
            onClick={saveGoal}
            disabled={busy || !goal}
            className="mt-4 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gold px-6 py-4 font-display text-[14px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px disabled:opacity-40"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Save & Finish"}
            {!busy && <ArrowRight className="size-3.5" strokeWidth={2.5} />}
          </button>
        </div>
      )}
    </div>
  );
}
