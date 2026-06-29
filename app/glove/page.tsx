import type { Metadata } from "next";
import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { Ribbon } from "@/components/site/ribbon";
import { Testing } from "@/components/site/testing";
import { Blueprint } from "@/components/site/blueprint";
import { Founder } from "@/components/site/founder";
import { Metrics } from "@/components/site/metrics";
import { Reserve } from "@/components/site/reserve";
import { Faq } from "@/components/site/faq";
import { Footer } from "@/components/site/footer";
import { StickyCta } from "@/components/site/sticky-cta";

export const metadata: Metadata = {
  alternates: { canonical: "/glove" },
  openGraph: { url: "/glove" },
};

export default function Page() {
  const locale = "en" as const;
  return (
    <>
      <Nav locale={locale} />
      <main id="top">
        <Hero locale={locale} />
        <Ribbon locale={locale} />
        <Testing locale={locale} />
        <Blueprint locale={locale} />
        <Founder locale={locale} />
        <Metrics locale={locale} />
        <Reserve locale={locale} />
        <Faq locale={locale} />
      </main>
      <Footer locale={locale} />
      <StickyCta locale={locale} />
    </>
  );
}
