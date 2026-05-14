import Link from "next/link";
import Image from "next/image";
import { LangSwitcher } from "./lang-switcher";
import { getMessages, localeHref, type Locale } from "@/lib/i18n";

export function Nav({ locale = "en" }: { locale?: Locale }) {
  const t = getMessages(locale).nav;
  const links = [
    { href: localeHref(locale, "/#story"),   label: t.story },
    { href: localeHref(locale, "/#product"), label: t.product },
    { href: localeHref(locale, "/#testing"), label: t.testing },
    { href: localeHref(locale, "/#faq"),     label: t.faq },
  ];
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-ink/90 via-ink/60 to-transparent backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-6 md:px-10">
        <Link href={localeHref(locale, "/")} aria-label="Gauge Golf home" className="flex items-center gap-2.5">
          <Image
            src="/media/GAUGE-LOGO.svg"
            alt="Gauge Golf"
            width={24}
            height={24}
            priority
            className="h-6 w-auto"
          />
          <span className="font-display text-sm font-extrabold tracking-[0.18em]">GAUGE</span>
        </Link>

        <nav className="hidden gap-7 md:flex" aria-label="Primary">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-white/60 transition hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <LangSwitcher locale={locale} />
          <a
            href={localeHref(locale, "/#access")}
            className="rounded-full border border-gold px-3.5 py-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-gold transition hover:bg-gold hover:text-ink"
          >
            {t.reserve}
          </a>
        </div>
      </div>
    </header>
  );
}
