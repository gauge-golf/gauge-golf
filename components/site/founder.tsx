import Image from "next/image";
import { SectionHead } from "./section-head";

export function Founder() {
  return (
    <section id="story" className="border-t border-white/10 py-20 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <SectionHead
          num="04 — The Founder"
          title={<>Built<br />independently.</>}
          lede="One golfer, building a better glove for high-volume practice — and sharing the process openly."
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
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/80">Konstantin · Founder</div>
            </div>
          </div>

          {/* Body */}
          <div>
            <p className="m-0 text-[22px] leading-snug md:text-[26px]">
              I&apos;m a handicap-16 golfer who spends most of his time{" "}
              <span className="text-gold">practicing on driving ranges.</span>
            </p>
            <p className="mt-4 text-base text-white/60">
              After dealing with wrist pain, glove durability issues and inconsistent grip during long practice sessions, I started building a glove focused on repetitive training and all-weather performance.
            </p>
            <p className="mt-4 text-base text-white/60">
              Gauge Golf documents that process publicly through real testing, manufacturing and field feedback.
            </p>

            <div className="mt-8 flex items-center gap-3.5">
              <span className="-rotate-[4deg] font-[Brush_Script_MT,Snell_Roundhand,Apple_Chancery,cursive] text-[32px] text-gold">Konstantin</span>
              <div className="flex flex-col">
                <span className="font-display text-sm font-bold tracking-wide">Konstantin Kazarichuk</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">Founder · hello@gauge-golf.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
