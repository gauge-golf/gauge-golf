import Image from "next/image";
import { SectionHead } from "./section-head";
import { LiteYouTube } from "./lite-youtube";
import { getMessages, type Locale, type Messages } from "@/lib/i18n";

type LabelKey = keyof Messages["testing"]["labels"];
type LocKey = keyof Messages["testing"]["locations"];
type SoonKey = "soon" | "soon_june";

type Tile =
  | {
      kind: "video";
      labelKey: LabelKey;
      day: number;
      locKey: LocKey;
      youtubeId: string;
      poster?: string;
    }
  | {
      kind: "soon";
      labelKey: LabelKey;
      hintKey: SoonKey;
      poster?: string;
    };

// Season 1 — 9 published Shorts + 3 upcoming. Add new ones at the end.
const tiles: Tile[] = [
  { kind: "video", labelKey: "idea",          day: 1,  locKey: "bali",      youtubeId: "WVyQSwEwuIc", poster: "/media/day-1-66.png" },
  { kind: "video", labelKey: "mvp",           day: 8,  locKey: "range",     youtubeId: "EniF9cZfPcs", poster: "/media/day-8.png" },
  { kind: "video", labelKey: "real_course",   day: 9,  locKey: "on_course", youtubeId: "QHxSvcpWl_o", poster: "/media/day-9.png" },
  { kind: "video", labelKey: "wedge",         day: 15, locKey: "range",     youtubeId: "IFe9rSKUVsw", poster: "/media/day-15.png" },
  { kind: "video", labelKey: "sweat",         day: 21, locKey: "heat",      youtubeId: "n3wvTMAaLq8", poster: "/media/day-21.png" },
  { kind: "video", labelKey: "pga",           day: 22, locKey: "pga",       youtubeId: "rxMDiEfzUqY", poster: "/media/day-22.png" },
  { kind: "video", labelKey: "arrived_china", day: 32, locKey: "china",     youtubeId: "5rsgDNElkIo", poster: "/media/gauge-post-03.png" },
  { kind: "video", labelKey: "to_factory",    day: 36, locKey: "guangzhou", youtubeId: "coDPuHp1z5U", poster: "/media/day-36.png" },
  { kind: "video", labelKey: "materials",     day: 42, locKey: "factory",   youtubeId: "gPjv741sCns", poster: "/media/gauge-post-01.png" },
  { kind: "video", labelKey: "first_sample",  day: 51, locKey: "factory",   youtubeId: "UVeLYQdEqsI", poster: "/media/founder-kazarichuk.png" },
  { kind: "video", labelKey: "field_testing", day: 60, locKey: "range", youtubeId: "hEvjezpH81s", poster: "/media/day-60.png" },
  { kind: "video", labelKey: "korea_launch",  day: 66, locKey: "range", youtubeId: "dHhZ96Kvq5Q", poster: "/media/day-66.png" },
];

export function Testing({ locale = "en" }: { locale?: Locale }) {
  const t = getMessages(locale).testing;
  return (
    <section id="testing" className="border-t border-white/10 py-20 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <SectionHead
          num={t.num}
          title={<>{t.title_line1}<br />{t.title_line2}</>}
          lede={t.lede}
        />

        <div className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
          <span className="size-1.5 rounded-full bg-gold" />
          <span>{t.season}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {tiles.map((tile, i) =>
            tile.kind === "video" ? (
              <VideoCard
                key={tile.youtubeId}
                day={tile.day}
                youtubeId={tile.youtubeId}
                poster={tile.poster}
                label={t.labels[tile.labelKey]}
                location={t.locations[tile.locKey]}
                dayWord={t.day}
              />
            ) : (
              <SoonCard
                key={`soon-${i}`}
                poster={tile.poster}
                label={t.labels[tile.labelKey]}
                hint={t[tile.hintKey]}
              />
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
  poster,
  dayWord,
}: {
  label: string;
  day: number;
  location: string;
  youtubeId: string;
  poster?: string;
  dayWord: string;
}) {
  return (
    <figure className="group relative aspect-[9/16] overflow-hidden rounded-[10px] border border-white/10 bg-black">
      <LiteYouTube id={youtubeId} title={`${dayWord} ${day} — ${label}`} posterOverride={poster} />

      {/* Top-right: Day chip — hidden once video is playing so YouTube's fullscreen button is reachable. */}
      <div className="pointer-events-none absolute right-2.5 top-2.5 rounded border border-gold/50 bg-black/60 px-1.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-gold backdrop-blur group-has-[iframe]:hidden">
        {dayWord} {day}
      </div>

      {/* Bottom: label + location — hidden once video is playing (covers YouTube controls otherwise). */}
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5 group-has-[iframe]:hidden">
        <div className="min-w-0">
          <div className="truncate font-display text-[13px] font-bold leading-tight">
            {label}
          </div>
          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/60">
            {location} · {dayWord} {day}
          </div>
        </div>
      </figcaption>
    </figure>
  );
}

function SoonCard({ label, hint, poster }: { label: string; hint: string; poster?: string }) {
  if (poster) {
    // Preview tile: real cover image + Coming-X chip overlay
    return (
      <figure className="relative aspect-[9/16] overflow-hidden rounded-[10px] border border-gold/40 bg-black">
        <Image
          src={poster}
          alt={label}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          quality={70}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

        {/* Top-right: Coming chip (mirrors Day chip on video tiles) */}
        <div className="pointer-events-none absolute right-2.5 top-2.5 rounded border border-gold/60 bg-black/60 px-1.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-gold backdrop-blur">
          {hint}
        </div>

        {/* Bottom: label */}
        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 p-2.5">
          <div className="font-display text-[13px] font-bold leading-tight">{label}</div>
          <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/70">
            <span className="size-1.5 animate-pulse-gold rounded-full bg-gold" />
            <span>{hint}</span>
          </div>
        </figcaption>
      </figure>
    );
  }

  // Plain placeholder
  return (
    <figure className="relative aspect-[9/16] overflow-hidden rounded-[10px] border border-dashed border-white/15 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.025)_0_2px,transparent_2px_12px),linear-gradient(180deg,#0c1c28,#06121b)]">
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
