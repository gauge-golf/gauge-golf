const items = [
  "Heat", "Rain", "Grip", { gold: "400 swings per session" },
  "Wrist stability", "All weather", "Universal performance",
  { gold: "Built in public" }, "One glove", "Built right first",
];

export function Ribbon() {
  const loop = [...items, ...items];
  return (
    <div aria-hidden className="overflow-hidden border-y border-white/10 bg-[#060f17]">
      <div className="flex animate-marquee gap-14 whitespace-nowrap py-4">
        {loop.map((it, i) => {
          const isGold = typeof it === "object";
          const text = isGold ? it.gold : it;
          return (
            <span key={i} className="flex items-center gap-14">
              <span className={`font-display text-sm font-extrabold uppercase tracking-[0.18em] ${isGold ? "text-gold" : "text-white/60"}`}>
                {text}
              </span>
              <span className="size-1.5 rounded-full bg-white/40" />
            </span>
          );
        })}
      </div>
    </div>
  );
}
