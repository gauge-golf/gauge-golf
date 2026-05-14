import { Play } from "lucide-react";
import { SectionHead } from "./section-head";

// Each tile auto-renders /public/media/testing-0X.mp4 (or .jpg) when present.
// See public/media/README.md for filenames and specs.
const tiles = [
  { label: "Range Testing",    src: "/media/testing-01.mp4" },
  { label: "Grip Testing",     src: "/media/testing-02.mp4" },
  { label: "Sweat Conditions", src: "/media/testing-03.mp4" },
  { label: "Factory Visit",    src: "/media/testing-04.mp4" },
  { label: "Golfer Reactions", src: "/media/testing-05.mp4" },
  { label: "Product Closeup",  src: "/media/testing-06.mp4" },
];

export function Testing() {
  return (
    <section id="testing" className="border-t border-white/10 py-20 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <SectionHead
          num="02 — Testing"
          title={<>Real testing.<br />Real feedback.</>}
          lede="Driving ranges, factory floors, sweat and weather — the videos speak for themselves."
        />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {tiles.map((t) => (
            <figure
              key={t.label}
              className="group relative aspect-[9/14] overflow-hidden rounded-[10px] border border-white/10 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.03)_0_2px,transparent_2px_12px),linear-gradient(180deg,#0f2230,#0a1a25)] md:aspect-[4/5]"
            >
              <video
                className="absolute inset-0 size-full object-cover"
                src={t.src}
                muted
                loop
                playsInline
                preload="none"
              />
              <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-70 transition group-hover:opacity-100">
                <div className="grid size-12 place-items-center rounded-full border border-white/30 bg-white/10 backdrop-blur">
                  <Play className="size-4 fill-white" strokeWidth={0} />
                </div>
              </div>
              <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70">
                <span>{t.label}</span>
                <span className="text-white/40">GAUGE</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
