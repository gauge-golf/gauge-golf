import { SectionHead } from "./section-head";

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
          {/* Product image — 4:5, matches Hero / Founder slots. No text overlays (labels are on the image itself). */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] border border-white/20 bg-[linear-gradient(180deg,#0B2230,#061722)]">
            <div
              aria-hidden
              className="absolute inset-0 bg-[url('/media/mvp-gauge.png')] bg-cover bg-center"
            />

            {/* Corner brackets — decorative, in corners only */}
            {[
              ["tl", "top-3 left-3 border-r-0 border-b-0"],
              ["tr", "top-3 right-3 border-l-0 border-b-0"],
              ["bl", "bottom-3 left-3 border-r-0 border-t-0"],
              ["br", "bottom-3 right-3 border-l-0 border-t-0"],
            ].map(([k, c]) => (
              <span key={k} className={`pointer-events-none absolute size-3.5 border border-white/30 ${c}`} />
            ))}
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
