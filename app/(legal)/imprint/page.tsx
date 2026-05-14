import type { Metadata } from "next";
import { LegalHeader, H2, P, UL, Note } from "@/components/site/legal";

export const metadata: Metadata = {
  title: "About this site · Gauge Golf",
  description: "Operator information for Gauge Golf — a product built and shipped by an individual.",
  alternates: { canonical: "/imprint" },
};

export default function Imprint() {
  return (
    <article>
      <LegalHeader num="Legal · 05" title="About this site" lastUpdated="May 14, 2026" />

      <P>
        Gauge Golf is operated by an individual, not by a legal entity. This page exists to be transparent about who runs the site and how to reach them.
      </P>

      <H2>Operator</H2>
      <UL>
        <li><strong className="text-white">Name:</strong> Konstantin Kazarichuk</li>
        <li><strong className="text-white">Role:</strong> Founder, designer, and currently sole operator of Gauge Golf</li>
        <li><strong className="text-white">Status:</strong> Individual seller — no registered company yet</li>
        <li><strong className="text-white">Residence:</strong> Indonesia (KITAS holder)</li>
        <li><strong className="text-white">Operations & fulfillment:</strong> Republic of Korea, from June 5, 2026</li>
      </UL>

      <H2>Contact</H2>
      <UL>
        <li><strong className="text-white">Email:</strong> <a className="text-gold hover:underline" href="mailto:hello@gauge-golf.com">hello@gauge-golf.com</a> · founder replies personally</li>
        <li><strong className="text-white">WhatsApp:</strong> <a className="text-gold hover:underline" href="https://wa.me/6281225290989" target="_blank" rel="noopener noreferrer">+62 812 2529 0989</a></li>
        <li><strong className="text-white">Instagram:</strong> <a className="text-gold hover:underline" href="https://www.instagram.com/kosta_golf" target="_blank" rel="noopener noreferrer">@kosta_golf</a></li>
        <li><strong className="text-white">YouTube:</strong> <a className="text-gold hover:underline" href="https://youtube.com/@gauge-golf" target="_blank" rel="noopener noreferrer">@gauge-golf</a></li>
        <li><strong className="text-white">TikTok:</strong> <a className="text-gold hover:underline" href="https://www.tiktok.com/@kazarichuk" target="_blank" rel="noopener noreferrer">@kazarichuk</a></li>
        <li><strong className="text-white">Facebook:</strong> <a className="text-gold hover:underline" href="https://www.facebook.com/share/18iQdmxpL7/" target="_blank" rel="noopener noreferrer">Konstantin Kazarichuk</a></li>
      </UL>
      <P>For face-to-face meetings in Seoul or fastest replies, please email or WhatsApp first to arrange.</P>

      <H2>Hosting</H2>
      <UL>
        <li>Website: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA</li>
        <li>Database: Neon (neon.com) — data stored in the Singapore region (ap-southeast-1)</li>
      </UL>

      <H2>Legal documents</H2>
      <UL>
        <li><a className="text-gold hover:underline" href="/privacy">Privacy Policy</a></li>
        <li><a className="text-gold hover:underline" href="/terms">Terms of Sale</a></li>
        <li><a className="text-gold hover:underline" href="/shipping">Shipping & Delivery</a></li>
        <li><a className="text-gold hover:underline" href="/refunds">Refunds & Returns</a></li>
      </UL>

      <Note>
        This is a small operation run by one person. If anything on this site is unclear or appears inaccurate, please email — corrections are made the same day.
      </Note>
    </article>
  );
}
