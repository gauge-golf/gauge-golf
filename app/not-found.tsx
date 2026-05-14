import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="relative grid min-h-[100svh] place-items-center px-6 pt-32 pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-[10%] bg-[radial-gradient(60%_40%_at_80%_20%,rgba(241,192,78,0.10),transparent_60%),radial-gradient(50%_40%_at_10%_110%,rgba(241,192,78,0.06),transparent_70%)]"
        />
        <div className="relative max-w-[640px] text-center">
          <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/20 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">
            <span className="size-1.5 animate-pulse-gold rounded-full bg-gold" />
            <span>404 — Page off-course</span>
          </div>

          <h1 className="font-display text-[clamp(48px,9vw,120px)] font-extrabold uppercase leading-[0.92] tracking-[-0.02em]">
            Lost in the<br />
            <span className="text-gold">rough.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-[44ch] text-base text-white/60 md:text-lg">
            The page you&apos;re looking for doesn&apos;t exist — or hasn&apos;t been built yet. Let&apos;s get you back on the fairway.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-full bg-gold px-5 py-4 font-display text-[13px] font-bold uppercase tracking-[0.14em] text-ink transition hover:bg-gold-hi"
            >
              Back to Home
              <ArrowRight className="size-3.5" strokeWidth={2.5} />
            </Link>
            <Link
              href="/#access"
              className="inline-flex items-center gap-2.5 rounded-full border border-white/20 px-5 py-4 font-display text-[13px] font-bold uppercase tracking-[0.14em] transition hover:border-white"
            >
              Reserve Early Access
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
