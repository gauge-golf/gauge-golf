"use client";

import { useEffect, useState } from "react";

// Drop your 4:5 photos here. Order = display order. Carousel auto-adapts to count.
// See /public/media/README.md for photographer brief.
const slides = [
  "/media/gauge-korea.png",
  "/media/gauge-hero-2.png",
  "/media/gauge-design-glove.png",
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
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: idx === i ? 1 : 0,
          }}
        />
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
