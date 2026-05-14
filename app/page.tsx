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

export default function Page() {
  return (
    <>
      <Nav />
      <main id="top">
        <Hero />
        <Ribbon />
        <Testing />
        <Blueprint />
        <Founder />
        <Metrics />
        <Reserve />
        <Faq />
      </main>
      <Footer />
      <StickyCta />
    </>
  );
}
