"use client";

import { useEffect, useRef, useState } from "react";
import { getMessages, localeHref, type Locale } from "@/lib/i18n";

export function StickyCta({ locale = "en" }: { locale?: Locale }) {
  const t = getMessages(locale).sticky;
  const [hidden, setHidden] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = document.getElementById("access");
    if (!target) return;
    const io = new IntersectionObserver(
      ([entry]) => setHidden(entry.isIntersecting),
      { threshold: 0.15 }
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`fixed inset-x-3 bottom-3 z-40 flex gap-2 rounded-full border border-white/20 bg-ink/90 p-2 shadow-[0_10px_30px_rgba(0,0,0,.4)] backdrop-blur-md transition md:hidden ${
        hidden ? "pointer-events-none translate-y-[120%] opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5 pl-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
        <span className="size-1.5 flex-none rounded-full bg-gold" />
        <span className="truncate">{t.eyebrow}</span>
      </div>
      <a
        href={localeHref(locale, "/#access")}
        className="inline-flex items-center rounded-full bg-gold px-4 py-2.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ink"
      >
        {t.cta}
      </a>
    </div>
  );
}
