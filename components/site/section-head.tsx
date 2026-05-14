export function SectionHead({
  num,
  title,
  subtitle,
  lede,
}: {
  num: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  lede: React.ReactNode;
}) {
  return (
    <div className="mb-12 grid grid-cols-1 gap-2 md:mb-16 md:grid-cols-[auto_1fr_auto] md:items-end md:gap-8">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{num}</div>
      <h2 className="font-display text-[clamp(34px,5vw,64px)] font-extrabold uppercase leading-[0.92] tracking-[-0.02em]">
        {title}
      </h2>
      <div className="flex max-w-[36ch] flex-col gap-2 text-left md:items-end md:text-right">
        {subtitle ? (
          <div className="font-display text-[15px] font-semibold text-white/85">{subtitle}</div>
        ) : null}
        <p className="m-0 text-[15px] text-white/60">{lede}</p>
      </div>
    </div>
  );
}
