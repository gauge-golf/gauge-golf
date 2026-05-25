"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// Drop your 4:5 photos here. Order = display order. Carousel auto-adapts to count.
// See /public/media/README.md for photographer brief.
const slides = [
  "/media/gauge-glove-v3.png",
  "/media/gauge-glove-v3-girl.png",
  // "/media/hero-04.jpg",
  // "/media/hero-05.jpg",
];

const INTERVAL_MS = 4500;

export function HeroCarousel() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setI((p) => (p + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((src, idx) => (
        <div
          key={src}
          aria-hidden={idx !== i}
          className="absolute inset-0 transition-opacity duration-[900ms] ease-out"
          style={{ opacity: idx === i ? 1 : 0 }}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority={idx === 0}
            quality={75}
            className="object-contain"
            style={{ filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))' }}
          />
          {/* Waiting List label */}
          <div className="pointer-events-none absolute right-3 top-3 rounded border border-gold/60 bg-black/60 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-gold backdrop-blur">
            Waiting List Only
          </div>
        </div>
      ))}

      {/* Dots — only shown when there are multiple slides */}
      <div className="absolute bottom-3.5 left-3.5 flex gap-1.5">
        {slides.length > 1 && slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setI(idx)}
            aria-label={`Show photo ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === i ? "w-6 bg-gold" : "w-1.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
