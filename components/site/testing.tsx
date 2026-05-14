import { SectionHead } from "./section-head";
import { LiteYouTube } from "./lite-youtube";

type Tile =
  | {
      kind: "video";
      label: string;
      day: number;
      location: string;
      youtubeId: string;
    }
  | {
      kind: "soon";
      label: string;
      hint: string;
    };

// Season 1 — 9 published Shorts + 3 upcoming. Add new ones at the end.
const tiles: Tile[] = [
  { kind: "video", label: "The Idea",            day: 1,  location: "Bali",       youtubeId: "WVyQSwEwuIc" },
  { kind: "video", label: "MVP · Elastic Band",  day: 8,  location: "Range",      youtubeId: "EniF9cZfPcs" },
  { kind: "video", label: "Real Course",         day: 9,  location: "On Course",  youtubeId: "QHxSvcpWl_o" },
  { kind: "video", label: "Wedge Practice",      day: 15, location: "Range",      youtubeId: "IFe9rSKUVsw" },
  { kind: "video", label: "Sweat Problem",       day: 21, location: "+30°C",      youtubeId: "n3wvTMAaLq8" },
  { kind: "video", label: "PGA Academy",         day: 22, location: "PGA",        youtubeId: "rxMDiEfzUqY" },
  { kind: "video", label: "Arrived in China",    day: 32, location: "China",      youtubeId: "5rsgDNElkIo" },
  { kind: "video", label: "To the Factory",      day: 36, location: "Guangzhou",  youtubeId: "coDPuHp1z5U" },
  { kind: "video", label: "Material Selection",  day: 42, location: "Factory",    youtubeId: "gPjv741sCns" },
  { kind: "soon",  label: "First Sample",        hint: "Coming soon" },
  { kind: "soon",  label: "Field Testing",       hint: "Coming soon" },
  { kind: "soon",  label: "Production",          hint: "Coming soon" },
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

        <div className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
          <span className="size-1.5 rounded-full bg-gold" />
          <span>Season 1 — Building from scratch</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {tiles.map((t, i) =>
            t.kind === "video" ? (
              <VideoCard key={t.youtubeId} {...t} />
            ) : (
              <SoonCard key={`soon-${i}`} {...t} />
            )
          )}
        </div>
      </div>
    </section>
  );
}

function VideoCard({
  label,
  day,
  location,
  youtubeId,
}: Extract<Tile, { kind: "video" }>) {
  return (
    <figure className="group relative aspect-[9/14] overflow-hidden rounded-[10px] border border-white/10 bg-black">
      <LiteYouTube id={youtubeId} title={`Day ${day} — ${label}`} />

      {/* Top-right: Day chip */}
      <div className="pointer-events-none absolute right-2.5 top-2.5 rounded border border-gold/50 bg-black/60 px-1.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-gold backdrop-blur">
        Day {day}
      </div>

      {/* Bottom: label + location */}
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5">
        <div className="min-w-0">
          <div className="truncate font-display text-[13px] font-bold leading-tight">
            {label}
          </div>
          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/60">
            {location} · Day {day}
          </div>
        </div>
      </figcaption>
    </figure>
  );
}

function SoonCard({ label, hint }: Extract<Tile, { kind: "soon" }>) {
  return (
    <figure className="relative aspect-[9/14] overflow-hidden rounded-[10px] border border-dashed border-white/15 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.025)_0_2px,transparent_2px_12px),linear-gradient(180deg,#0c1c28,#06121b)]">
      <div className="absolute inset-0 grid place-items-center p-4 text-center">
        <div>
          <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full border border-white/20 bg-black/40">
            <span className="size-1.5 animate-pulse-gold rounded-full bg-gold" />
          </div>
          <div className="font-display text-[13px] font-bold leading-tight">{label}</div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
            {hint}
          </div>
        </div>
      </div>
    </figure>
  );
}
