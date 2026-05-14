import Image from "next/image";
import { SectionHead } from "./section-head";
import { getMessages, type Locale } from "@/lib/i18n";

export function Founder({ locale = "en" }: { locale?: Locale }) {
  const t = getMessages(locale).founder;
  return (
    <section id="story" className="border-t border-white/10 py-20 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <SectionHead
          num={t.num}
          title={<>{t.title_line1}<br />{t.title_line2}</>}
          subtitle={t.subtitle || undefined}
          lede={t.lede}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          {/* Founder photo slot — drop /public/media/founder.jpg to fill it. */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] border border-white/10 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.03)_0_2px,transparent_2px_10px),linear-gradient(180deg,#0B2230,#061722)]">
            <Image
              src="/media/kosta-golf.jpg"
              alt="Konstantin Kazarichuk, founder of Gauge Golf"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              quality={75}
              className="object-cover object-left"
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-4.5">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/80">{t.caption}</div>
            </div>
          </div>

          {/* Body */}
          <div>
            <p className="m-0 text-[22px] leading-snug md:text-[26px]">
              {t.p1_pre}
              <span className="text-gold">{t.p1_gold}</span>
              {t.p1_post}
            </p>
            <p className="mt-4 text-base text-white/60">
              {t.p2}
            </p>
            <p className="mt-4 text-base text-white/60">
              {t.p3}
            </p>

            <div className="mt-8 flex items-center gap-3.5">
              <span className="-rotate-[4deg] font-[Brush_Script_MT,Snell_Roundhand,Apple_Chancery,cursive] text-[32px] text-gold">{t.sig_name}</span>
              <div className="flex flex-col">
                <span className="font-display text-sm font-bold tracking-wide">{t.sig_full}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">{t.sig_role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
