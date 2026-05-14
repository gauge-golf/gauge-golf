import { SectionHead } from "./section-head";
import { getMessages, type Locale } from "@/lib/i18n";

export function Metrics({ locale = "en" }: { locale?: Locale }) {
  const t = getMessages(locale).metrics;
  const items = t.items;
  return (
    <section className="border-t border-white/10 py-20 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <SectionHead
          num={t.num}
          title={<>{t.title_line1}<br />{t.title_line2}</>}
          subtitle={t.subtitle || undefined}
          lede={t.lede}
        />

        <div className="grid grid-cols-2 overflow-hidden rounded-[18px] border border-white/10 md:grid-cols-4">
          {items.map((m, i) => (
            <div
              key={`${m.v}-${i}`}
              className={`flex min-w-0 flex-col gap-3 p-5 md:p-7 ${i % 2 === 0 ? "border-r border-white/10" : ""} ${i < 2 ? "border-b border-white/10 md:border-b-0" : ""} md:border-r md:border-white/10 md:last:border-r-0 md:[&:nth-child(2)]:border-r md:[&:nth-child(4)]:border-r-0`}
            >
              <span className="font-display text-[clamp(22px,6vw,56px)] font-black leading-[0.95] tracking-[-0.02em] [overflow-wrap:anywhere] [word-break:break-word]">
                {m.v}
              </span>
              {m.label ? (
                <span className="font-display text-sm font-semibold text-white/85">{m.label}</span>
              ) : null}
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/60">{m.d}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
