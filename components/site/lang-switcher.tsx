"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Globe, Check } from "lucide-react";
import type { Locale } from "@/lib/i18n";

type LangEntry = {
  code: Locale;
  label: string; // native name
  short: string; // 2-letter chip
};

const LANGS: LangEntry[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "ko", label: "한국어",   short: "KO" },
];

/**
 * Map a pathname under one locale tree to its sibling in the target locale tree.
 * EN lives under "/glove", KO lives under "/ko".
 * "/glove"      -> "/ko"          (en -> ko)
 * "/ko"         -> "/glove"       (ko -> en)
 * "/ko/foo"     -> "/glove/foo"   (ko -> en)
 * "/glove/foo"  -> "/ko/foo"      (en -> ko)
 */
function mapPathToLocale(pathname: string, target: Locale): string {
  const isKo = pathname === "/ko" || pathname.startsWith("/ko/");
  const isGlove = pathname === "/glove" || pathname.startsWith("/glove/");
  const bare = isKo
    ? pathname.replace(/^\/ko/, "") || "/"
    : isGlove
      ? pathname.replace(/^\/glove/, "") || "/"
      : pathname;
  if (target === "en") return bare === "/" ? "/glove" : `/glove${bare}`;
  return bare === "/" ? "/ko" : `/ko${bare}`;
}

export function LangSwitcher({ locale = "en" }: { locale?: Locale }) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === locale) ?? LANGS[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change language"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 transition hover:border-white hover:text-white"
      >
        <Globe className="size-3.5" strokeWidth={2} />
        <span>{current.short}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-56 overflow-hidden rounded-[10px] border border-white/15 bg-ink-2/95 shadow-[0_18px_40px_rgba(0,0,0,.45)] backdrop-blur-md"
        >
          <div className="border-b border-white/10 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-white/40">
            Language
          </div>
          <ul className="m-0 flex list-none flex-col p-1">
            {LANGS.map((l) => {
              const active = l.code === current.code;
              const href = mapPathToLocale(pathname, l.code);
              return (
                <li key={l.code}>
                  <Link
                    href={href}
                    hrefLang={l.code}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={`flex w-full items-center justify-between gap-3 rounded-[6px] px-3 py-2.5 text-left transition ${
                      active
                        ? "bg-gold/[0.08] text-white"
                        : "text-white/80 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 w-6">
                        {l.short}
                      </span>
                      <span className="font-display text-[13px] font-semibold">
                        {l.label}
                      </span>
                    </span>
                    {active ? (
                      <Check className="size-3.5 text-gold" strokeWidth={2.5} />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
