import { getMessages, type Locale } from "@/lib/i18n";

export function Ribbon({ locale = "en" }: { locale?: Locale }) {
  const items = getMessages(locale).ribbon;
  const loop = [...items, ...items];
  return (
    <div aria-hidden className="overflow-hidden border-y border-white/10 bg-[#060f17]">
      <div className="flex animate-marquee gap-14 whitespace-nowrap py-4">
        {loop.map((it, i) => {
          const isGold = it.gold === true;
          return (
            <span key={i} className="flex items-center gap-14">
              <span className={`font-display text-sm font-extrabold uppercase tracking-[0.18em] ${isGold ? "text-gold" : "text-white/60"}`}>
                {it.t}
              </span>
              <span className="size-1.5 rounded-full bg-white/40" />
            </span>
          );
        })}
      </div>
    </div>
  );
}
