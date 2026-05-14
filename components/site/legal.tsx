// Shared typography primitives for legal pages.
// Keeps voice consistent and lets us tweak in one place.

export function LegalHeader({ num, title, lastUpdated }: { num: string; title: string; lastUpdated: string }) {
  return (
    <header className="mb-10 border-b border-white/10 pb-8">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{num}</div>
      <h1 className="mt-3 font-display text-[clamp(34px,5.6vw,56px)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em]">
        {title}
      </h1>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
        Last updated · {lastUpdated}
      </p>
    </header>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 mb-3 font-display text-xl font-extrabold uppercase tracking-[0.04em] text-white md:text-2xl">
      {children}
    </h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-[15px] leading-relaxed text-white/70">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mb-4 ml-5 list-disc space-y-2 text-[15px] leading-relaxed text-white/70 marker:text-gold">
      {children}
    </ul>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-[10px] border border-gold/30 bg-gold/[0.04] p-4 font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-white/60">
      {children}
    </div>
  );
}
