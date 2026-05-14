"use client";

import { useEffect, useState } from "react";

// Drop your 4:5 photos at these paths (1080×1350 minimum, JPEG ~85%).
// See /public/media/README.md for the full brief.
const slides = [
  "/media/hero-01.jpg",
  "/media/hero-02.jpg",
  "/media/hero-03.jpg",
  "/media/hero-04.jpg",
  "/media/hero-05.jpg",
];

const INTERVAL_MS = 4500;

export function HeroCarousel() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
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
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: idx === i ? 1 : 0,
          }}
        />
      ))}

      {/* Dots — bottom-left, minimal. No text overlay on the photo subject. */}
      <div className="absolute bottom-3.5 left-3.5 flex gap-1.5">
        {slides.map((_, idx) => (
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
