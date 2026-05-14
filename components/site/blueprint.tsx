import { SectionHead } from "./section-head";

const tags = [
  { pos: "top-[8%] right-[18%]", label: "Microfiber Construction", side: "right" },
  { pos: "top-[22%] left-[8%]", label: "Wrist Stability", side: "left" },
  { pos: "top-[38%] right-[6%]", label: "Grip Pattern", side: "right" },
  { pos: "bottom-[32%] left-[6%]", label: "Reinforced Palm", side: "left" },
  { pos: "bottom-[18%] right-[8%]", label: "Universal Conditions", side: "right" },
] as const;

const feats = [
  ["01", "Wrist Stability", "Additional support designed for repetitive swing sessions."],
  ["02", "Grip Pattern", "Consistent grip performance in sweat and rain."],
  ["03", "Reinforced Palm", "Built for high-volume driving range practice."],
  ["04", "Microfiber Construction", "Soft feel with improved durability."],
  ["05", "Universal Conditions", "Designed for indoor, outdoor, humid and wet environments."],
];

export function Blueprint() {
  return (
    <section id="product" className="border-t border-white/10 py-20 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <SectionHead
          num="03 — The Product"
          title={<>Built for<br />repetition.</>}
          lede="A universal performance golf glove designed for grip, wrist stability and repetitive practice in heat, rain and all-weather training."
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          {/* Canvas */}
          <div className="relative min-h-[460px] overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px)_0_0/40px_40px,linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)_0_0/40px_40px,radial-gradient(80%_70%_at_50%_50%,rgba(241,192,78,.06),transparent_70%),linear-gradient(180deg,#061522,#04101a)]">
            {[
              ["top-3.5 left-3.5 border-r-0 border-b-0"],
              ["top-3.5 right-3.5 border-l-0 border-b-0"],
              ["bottom-3.5 left-3.5 border-r-0 border-t-0"],
              ["bottom-3.5 right-3.5 border-l-0 border-t-0"],
            ].map(([c], i) => (
              <span key={i} className={`absolute size-3.5 border border-gold ${c}`} />
            ))}

            <div className="absolute left-4 top-4 flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">Drawing</span>
              <span className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-gold">GG-G01 · Universal</span>
            </div>
            <div className="absolute right-4 top-4 flex flex-col items-end gap-1 text-right">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">Type</span>
              <span className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-gold">Performance</span>
            </div>

            {/* Glove silhouette */}
            <div className="absolute inset-0 grid place-items-center">
              <div className="relative aspect-[4/5] w-[78%] max-w-[460px]">
                <div className="absolute inset-0 rounded-[30%_30%_24%_24%/18%_18%_12%_12%] border border-dashed border-white/20 bg-white/[0.02]" />
                {tags.map((t) => (
                  <div
                    key={t.label}
                    className={`absolute flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] ${t.pos} ${
                      t.side === "right" ? "flex-row-reverse text-right" : ""
                    }`}
                  >
                    <span className="size-2.5 rounded-full bg-gold shadow-[0_0_0_4px_rgba(241,192,78,0.18)]" />
                    <span className="h-px w-10 bg-gold" />
                    <span className="rounded border border-white/20 bg-black/40 px-2 py-1">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-4">
            {feats.map(([ix, h, p]) => (
              <div key={ix} className="relative rounded-[10px] border border-white/10 bg-white/[0.015] p-4.5 pl-14">
                <span className="absolute left-4.5 top-4.5 font-mono text-[11px] uppercase tracking-[0.18em] text-gold">{ix}</span>
                <h4 className="m-0 mb-1 font-display text-lg font-bold">{h}</h4>
                <p className="m-0 text-sm text-white/60">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
