import Link from "next/link";
import { GaugeMark } from "./logo";

const links = [
  { href: "#story", label: "Story" },
  { href: "#product", label: "Product" },
  { href: "#testing", label: "Testing" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-ink/90 via-ink/60 to-transparent backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-6 md:px-10">
        <Link href="#top" aria-label="Gauge Golf home" className="flex items-center gap-2.5">
          <GaugeMark className="h-5 w-auto" />
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

        <a
          href="#access"
          className="rounded-full border border-gold px-3.5 py-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-gold transition hover:bg-gold hover:text-ink"
        >
          Reserve
        </a>
      </div>
    </header>
  );
}
