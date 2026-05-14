"use client";

import { useActionState, useState } from "react";
import { ArrowRight } from "lucide-react";
import { reserve, type ReserveState } from "@/app/actions";

const initial: ReserveState = { ok: false, message: "" };

const fieldCls =
  "w-full rounded-[6px] border border-white/20 bg-black/35 px-3.5 py-3.5 text-[15px] text-white placeholder:text-white/40 focus:border-gold focus:bg-black/50 focus:outline-none";
const labelCls = "font-mono text-[10px] uppercase tracking-[0.22em] text-white/40";

export function Reserve() {
  const [state, formAction, pending] = useActionState(reserve, initial);
  const [country, setCountry] = useState("");

  return (
    <section id="access" className="border-t border-white/10 py-20 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-8 rounded-[18px] border border-white/20 bg-[radial-gradient(60%_80%_at_0%_0%,rgba(241,192,78,0.07),transparent_60%),linear-gradient(180deg,#0B2230,#061722)] p-8 lg:grid-cols-2 lg:gap-14 lg:p-14">
          {/* Left */}
          <div>
            <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">06 — Early Access</div>
            <h2 className="m-0 font-display text-[clamp(34px,4.6vw,58px)] font-extrabold leading-none tracking-[-0.01em]">
              Early Access
            </h2>
            <p className="mt-5 max-w-[44ch] text-base text-white/60">
              Early access requests are currently handled directly by the founder before the first production batch opens.
            </p>
          </div>

          {/* Form / success */}
          {state.ok ? (
            <div className="grid place-items-center rounded-[10px] border border-gold bg-gold/[0.06] p-8 text-center">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
                  <span className="size-1.5 animate-pulse-gold rounded-full bg-gold" />
                  <span>Confirmed</span>
                </div>
                <h4 className="m-0 mb-2 font-display text-2xl font-bold text-gold">You&apos;re on the list.</h4>
                <p className="m-0 max-w-[40ch] text-sm text-white/60">
                  You&apos;ll receive future updates and first-batch access information directly from Konstantin.
                </p>
              </div>
            </div>
          ) : (
            <form action={formAction} className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              <Field name="name" label="Name" placeholder="First and last" required autoComplete="name" />
              <Field name="email" label="Email" type="email" placeholder="you@email.com" required autoComplete="email" inputMode="email" />

              {/* Country */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label htmlFor="f-country" className={labelCls}>Country</label>
                <select
                  id="f-country"
                  name="country"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  autoComplete="country-name"
                  className={fieldCls}
                >
                  <option value="" disabled>Choose your country</option>
                  <option value="United States">United States</option>
                  <option value="South Korea">South Korea</option>
                  <option value="Japan">Japan</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Other">Other (worldwide)</option>
                </select>
              </div>

              {/* Conditional: US state */}
              {country === "United States" && (
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="f-state" className={labelCls}>State</label>
                  <select id="f-state" name="state" required defaultValue="" className={fieldCls}>
                    <option value="" disabled>Choose your state</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {/* Conditional: free-text country */}
              {country === "Other" && (
                <div className="md:col-span-2">
                  <Field name="state" label="Where are you based?" placeholder="City, country" required />
                </div>
              )}

              {/* Hand */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="f-hand" className={labelCls}>Glove hand</label>
                <select id="f-hand" name="hand" defaultValue="" className={fieldCls}>
                  <option value="" disabled>Choose one</option>
                  <option value="Left">Left (right-handed golfer)</option>
                  <option value="Right">Right (left-handed golfer)</option>
                  <option value="Both">Both</option>
                  <option value="Not sure">Not sure</option>
                </select>
              </div>

              {/* Size */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="f-size" className={labelCls}>Glove size</label>
                <select id="f-size" name="glove_size" defaultValue="" className={fieldCls}>
                  <option value="" disabled>Choose size</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="ML">ML</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="Not sure">Not sure — recommend me</option>
                </select>
              </div>

              {/* Size reference helper */}
              <p className="md:col-span-2 -mt-1 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-white/40">
                Size reference · S ≈ KR 19–21 / JP 21–22 · M ≈ KR 21–23 / JP 22–23 · ML ≈ KR 23–25 / JP 23–24 / US M–L · L ≈ KR 25–26 / JP 24–25 · XL ≈ KR 26+ / JP 25+
              </p>

              <details className="md:col-span-2">
                <summary className="cursor-pointer select-none font-mono text-[11px] uppercase tracking-[0.16em] text-white/60 hover:text-gold">
                  + Add details (optional)
                </summary>
                <div className="mt-3.5 grid grid-cols-1 gap-3.5 md:grid-cols-2">
                  <Field name="social" label="Instagram / X" optional placeholder="@handle" autoComplete="username" />
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="f-handicap" className={labelCls}>
                      Handicap <span className="ml-1.5 text-[9px]">optional</span>
                    </label>
                    <select id="f-handicap" name="handicap" defaultValue="" className={fieldCls}>
                      <option value="">Choose one</option>
                      <option>Beginner</option>
                      <option>20+</option>
                      <option>10–20</option>
                      <option>Under 10</option>
                      <option>Scratch</option>
                      <option>Don&apos;t know</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label htmlFor="f-message" className={labelCls}>
                      Message <span className="ml-1.5 text-[9px]">optional</span>
                    </label>
                    <textarea
                      id="f-message"
                      name="message"
                      placeholder="Anything you'd like Konstantin to know."
                      maxLength={2000}
                      className={`${fieldCls} min-h-24 resize-y`}
                    />
                  </div>
                </div>
              </details>

              <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2.5 rounded-full bg-gold px-5 py-4 font-display text-[13px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi disabled:opacity-60"
                >
                  {pending ? "Sending…" : "Reserve a Pair"}
                  <ArrowRight className="size-3.5" strokeWidth={2.5} />
                </button>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
                  No spam · Founder replies directly
                </span>
              </div>

              {state.message && !state.ok && (
                <p className="md:col-span-2 font-mono text-[11px] uppercase tracking-[0.14em] text-gold">
                  {state.message}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  name, label, type = "text", placeholder, required, optional, autoComplete, inputMode,
}: {
  name: string; label: string; type?: string; placeholder?: string;
  required?: boolean; optional?: boolean;
  autoComplete?: string; inputMode?: "text" | "email" | "tel" | "numeric" | "url" | "search";
}) {
  const id = `f-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelCls}>
        {label}
        {optional && <span className="ml-1.5 text-[9px]">optional</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={fieldCls}
      />
    </div>
  );
}

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","Washington DC",
];
