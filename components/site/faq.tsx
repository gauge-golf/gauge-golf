import { Plus } from "lucide-react";
import { SectionHead } from "./section-head";
import { getMessages, type Locale } from "@/lib/i18n";

export function Faq({ locale = "en" }: { locale?: Locale }) {
  const t = getMessages(locale).faq;
  return (
    <section id="faq" className="border-t border-white/10 py-20 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <SectionHead
          num={t.num}
          title={<>{t.title_line1}<br />{t.title_line2}</>}
          lede={
            <>
              {t.lede_pre}
              <a href="mailto:hello@gauge-golf.com" className="text-gold">hello@gauge-golf.com</a>
              {t.lede_post}
            </>
          }
        />

        <div className="flex flex-col">
          {t.items.map((item, i) => (
            <details
              key={i}
              open={i === 0}
              className="group border-t border-white/10 px-1 py-5 last:border-b last:border-white/10"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-display text-lg font-bold leading-tight tracking-tight md:text-2xl">
                {item.q}
                <span className="relative size-7 flex-none rounded-full border border-white/20 transition group-open:border-gold group-open:bg-gold">
                  <Plus className="absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 text-white transition group-open:rotate-45 group-open:text-ink" strokeWidth={2} />
                </span>
              </summary>
              <div className="mt-3 max-w-[70ch] text-[15px] text-white/60">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
