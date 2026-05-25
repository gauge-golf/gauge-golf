"use client";

import { useActionState, useState } from "react";
import { ArrowRight } from "lucide-react";
import { reserve, type ReserveState } from "@/app/actions";
import { getMessages, type Locale } from "@/lib/i18n";

const initial: ReserveState = { ok: false, message: "" };

const fieldCls =
  "w-full rounded-[8px] border border-white/15 bg-black/20 px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:border-white/40 focus:bg-black/30 focus:outline-none transition-colors";
const labelCls = "mb-2 font-mono text-[11px] uppercase tracking-[0.20em] text-white/50";

export function Reserve({ locale = "en" }: { locale?: Locale }) {
  const t = getMessages(locale).reserve;
  // Country values are always stored in English in the DB; only labels are translated.
  const COUNTRIES = [
    { v: "United States", flag: "🇺🇸", short: t.country.us },
    { v: "South Korea",   flag: "🇰🇷", short: t.country.kr },
    { v: "Japan",         flag: "🇯🇵", short: t.country.jp },
    { v: "Singapore",     flag: "🇸🇬", short: t.country.sg },
  ];
  const [state, formAction, pending] = useActionState(reserve, initial);
  const [country, setCountry] = useState("");

  return (
    <section id="access" className="border-t border-white/10 py-20 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-8 rounded-[18px] border border-white/20 bg-[radial-gradient(60%_80%_at_0%_0%,rgba(241,192,78,0.07),transparent_60%),linear-gradient(180deg,#0B2230,#061722)] p-8 lg:grid-cols-2 lg:gap-14 lg:p-14">
          {/* Left */}
          <div>
            <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">{t.num}</div>
            <h2 className="m-0 font-display text-[clamp(34px,4.6vw,58px)] font-extrabold leading-none tracking-[-0.01em]">
              {t.title}
            </h2>
            <p className="mt-5 max-w-[44ch] text-base text-white/60">
              {t.lede_text}
            </p>
          </div>

          {/* Form / success */}
          {state.ok ? (
            <div className="grid place-items-center rounded-[10px] border border-gold bg-gold/[0.06] p-8 text-center">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
                  <span className="size-1.5 animate-pulse-gold rounded-full bg-gold" />
                  <span>{t.ok_chip}</span>
                </div>
                <h4 className="m-0 mb-2 font-display text-2xl font-bold text-gold">{t.ok_title}</h4>
                <p className="m-0 max-w-[40ch] text-sm text-white/60">
                  {t.ok_body}
                </p>
              </div>
            </div>
          ) : (
            <form action={formAction} className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field name="name" label={t.f_name} placeholder={t.f_name_ph} required autoComplete="name" />
              <Field name="email" label={t.f_email} type="email" placeholder={t.f_email_ph} required autoComplete="email" inputMode="email" />

              {/* Country — chip selector */}
              <div className="flex flex-col md:col-span-2">
                <label className={labelCls}>{t.f_country}</label>
                <input type="hidden" name="country" value={country} required />
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map((c) => {
                    const active = country === c.v;
                    return (
                      <button
                        key={c.v}
                        type="button"
                        onClick={() => setCountry(c.v)}
                        className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] transition ${
                          active
                            ? "border-gold bg-gold/15 text-gold"
                            : "border-white/20 bg-black/20 text-white/70 hover:border-white/50"
                        }`}
                      >
                        <span aria-hidden className="text-base leading-none">{c.flag}</span>
                        {c.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional secondary fields */}
              {country === "United States" && (
                <div className="flex flex-col md:col-span-2">
                  <label htmlFor="f-state" className={labelCls}>{t.f_state}</label>
                  <select id="f-state" name="state" required defaultValue="" className={fieldCls}>
                    <option value="" disabled>{t.f_state_ph}</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {/* Hand + Size — paired row */}
              <div className="flex flex-col">
                <label htmlFor="f-hand" className={labelCls}>{t.f_hand}</label>
                <select id="f-hand" name="hand" defaultValue="" className={fieldCls}>
                  <option value="" disabled>{t.f_choose}</option>
                  <option value="Left">{t.hand_left}</option>
                  <option value="Right">{t.hand_right}</option>
                  <option value="Both">{t.hand_both}</option>
                  <option value="Not sure">{t.hand_notsure}</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="f-size" className={labelCls}>{t.f_size}</label>
                <select id="f-size" name="glove_size" defaultValue="" className={fieldCls}>
                  <option value="" disabled>{t.f_choose}</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="ML">ML</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="Not sure">{t.size_notsure}</option>
                </select>
              </div>

              {/* Size guide — on-demand */}
              <details className="md:col-span-2 -mt-2">
                <summary className="cursor-pointer select-none font-mono text-[11px] uppercase tracking-[0.16em] text-white/40 hover:text-white/70 transition-colors">
                  ▼ {t.size_help}
                </summary>
                <div className="mt-3 rounded-[8px] border border-white/10 bg-black/20 p-4 font-mono text-[11px] tracking-[0.08em] text-white/50">
                  <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                    <div className="text-white/70">S</div>
                    <div>KR 19–21 · JP 21–22</div>
                    <div className="text-white/70">M</div>
                    <div>KR 21–23 · JP 22–23</div>
                    <div className="text-white/70">ML</div>
                    <div>KR 23–25 · JP 23–24 · US M–L</div>
                    <div className="text-white/70">L</div>
                    <div>KR 25–26 · JP 24–25</div>
                    <div className="text-white/70">XL</div>
                    <div>KR 26+ · JP 25+</div>
                  </div>
                </div>
              </details>

              {/* Optional details */}
              <details className="md:col-span-2">
                <summary className="cursor-pointer select-none font-mono text-[11px] uppercase tracking-[0.16em] text-white/40 hover:text-white/70 transition-colors">
                  ▼ {t.details_more}
                </summary>
                <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Field name="social" label={t.f_social} optional optionalLabel={t.optional} placeholder={t.f_social_ph} autoComplete="username" />
                  <div className="flex flex-col">
                    <label htmlFor="f-handicap" className={labelCls}>
                      {t.f_handicap} <span className="ml-1.5 text-[9px]">{t.optional}</span>
                    </label>
                    <select id="f-handicap" name="handicap" defaultValue="" className={fieldCls}>
                      <option value="">{t.f_choose_one}</option>
                      <option value="Beginner">{t.h_beginner}</option>
                      <option value="20+">20+</option>
                      <option value="10–20">10–20</option>
                      <option value="Under 10">Under 10</option>
                      <option value="Scratch">Scratch</option>
                      <option value="Don't know">{t.h_dontknow}</option>
                    </select>
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <label htmlFor="f-message" className={labelCls}>
                      {t.f_message} <span className="ml-1.5 text-[9px]">{t.optional}</span>
                    </label>
                    <textarea
                      id="f-message"
                      name="message"
                      placeholder={t.f_message_ph}
                      maxLength={2000}
                      className={`${fieldCls} min-h-24 resize-y`}
                    />
                  </div>
                </div>
              </details>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 md:col-span-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2.5 rounded-full bg-gold px-6 py-4 font-display text-[12px] font-bold uppercase tracking-[0.16em] text-ink transition hover:bg-gold-hi disabled:opacity-60"
                >
                  {pending ? t.sending : t.submit}
                  <ArrowRight className="size-3.5" strokeWidth={2.5} />
                </button>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/35">
                  {t.no_spam}
                </span>
              </div>

              {state.message && !state.ok && (
                <p className="md:col-span-2 font-mono text-[11px] uppercase tracking-[0.14em] text-gold">
                  {state.message}
                </p>
              )}

              {/* Trust badges */}
              <div className="md:col-span-2 mt-6 pt-6 border-t border-white/10">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-white/40">
                  {/* Founder tested */}
                  <div className="flex items-center gap-2">
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em]">{t.trust_tested}</span>
                  </div>
                  {/* No payment yet */}
                  <div className="flex items-center gap-2">
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em]">{t.trust_no_payment}</span>
                  </div>
                  {/* Payment methods coming */}
                  <div className="flex items-center gap-2">
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em]">{t.trust_payment_soon}</span>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  name, label, type = "text", placeholder, required, optional, optionalLabel = "optional", autoComplete, inputMode,
}: {
  name: string; label: string; type?: string; placeholder?: string;
  required?: boolean; optional?: boolean; optionalLabel?: string;
  autoComplete?: string; inputMode?: "text" | "email" | "tel" | "numeric" | "url" | "search";
}) {
  const id = `f-${name}`;
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className={labelCls}>
        {label}
        {optional && <span className="ml-1.5 text-[9px]">{optionalLabel}</span>}
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
