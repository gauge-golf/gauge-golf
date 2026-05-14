"use client";

import { Play } from "lucide-react";
import { useState } from "react";

// Lite YouTube embed: shows thumbnail until clicked, then loads iframe in place.
// Keeps the user on the page (no target="_blank"). Iframe is configured to
// minimise YouTube's pull-back-to-youtube affordances.
export function LiteYouTube({
  id,
  title,
  posterOverride,
}: {
  id: string;
  title: string;
  posterOverride?: string;
}) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <iframe
        title={title}
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 size-full border-0"
      />
    );
  }

  const poster =
    posterOverride ?? `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={`Play ${title}`}
      className="group absolute inset-0 size-full cursor-pointer"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition group-hover:scale-[1.02]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="grid size-14 place-items-center rounded-full border border-white/40 bg-black/50 backdrop-blur transition group-hover:scale-110 group-hover:border-gold group-hover:bg-gold/20">
          <Play className="size-5 fill-white pl-0.5" strokeWidth={0} />
        </div>
      </div>
    </button>
  );
}
