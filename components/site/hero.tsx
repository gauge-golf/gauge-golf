import { ArrowRight, Play } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-stretch overflow-hidden pb-20 pt-32">
      {/* ambient bg */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[10%] bg-[radial-gradient(60%_40%_at_80%_20%,rgba(241,192,78,0.10),transparent_60%),radial-gradient(50%_40%_at_10%_110%,rgba(241,192,78,0.06),transparent_70%)]"
      />

      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 items-end gap-10 px-6 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch lg:gap-14">
        {/* LEFT */}
        <div className="relative flex flex-col justify-between gap-8">
          <div>
            <div className="inline-flex w-max items-center gap-3 rounded-full border border-white/20 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">
              <span className="size-1.5 animate-pulse-gold rounded-full bg-gold" />
              <span>Built in public</span>
            </div>

            <h1 className="mt-6 font-display text-[clamp(48px,9vw,132px)] font-extrabold uppercase leading-[0.92] tracking-[-0.02em]">
              One Glove.<br />
              Every <span className="text-gold">Condition.</span>
            </h1>

            <p className="mt-6 max-w-[46ch] text-base text-white/60 md:text-lg">
              Built for golfers who practice until their hands hurt.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#access"
                className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-full bg-gold px-5 py-4 font-display text-[13px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi active:translate-y-px"
              >
                Reserve Early Access
                <ArrowRight className="size-3.5" strokeWidth={2.5} />
              </a>
              <a
                href="#testing" className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-white/20 px-5 py-4 font-display text-[13px] font-bold uppercase tracking-[0.14em] transition hover:border-white"
              >
                Watch Testing Videos
                <Play className="size-3.5 fill-current" strokeWidth={0} />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-8 border-t border-white/10 pt-6">
            {[
              ["Designed for", "Long practice sessions"],
              ["Built for", "Heat · Rain · Humidity"],
              ["Focus", "One glove. Built right."],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</span>
                <span className="font-display text-lg font-bold tracking-wide">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — media placeholder */}
        <div className="relative min-h-[420px] overflow-hidden rounded-[18px] border border-white/20 bg-[radial-gradient(120%_90%_at_60%_30%,rgba(241,192,78,0.10),transparent_60%),linear-gradient(180deg,#0B2230,#061722)] lg:min-h-0 [aspect-ratio:4/5] lg:[aspect-ratio:auto]">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.03)_0_2px,transparent_2px_10px),radial-gradient(80%_60%_at_50%_40%,rgba(255,255,255,.05),transparent_70%)]" />
          {[
            ["tl", "top-3 left-3 border-r-0 border-b-0"],
            ["tr", "top-3 right-3 border-l-0 border-b-0"],
            ["bl", "bottom-3 left-3 border-r-0 border-t-0"],
            ["br", "bottom-3 right-3 border-l-0 border-t-0"],
          ].map(([k, c]) => (
            <span key={k} className={`absolute size-3.5 border border-white/40 ${c}`} />
          ))}

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4.5">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded border border-white/20 bg-black/40 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em]">REC · FIELD TEST</span>
              <span className="rounded border border-gold/50 bg-black/40 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-gold">
                GAUGE · 한국 · 中国
              </span>
            </div>
            <div>
              <div className="font-display text-[clamp(48px,8vw,96px)] font-black uppercase leading-[0.9] tracking-[-0.02em]">
                One Glove.<br /><span className="text-gold">Every Condition.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
