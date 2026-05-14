import type { Metadata } from "next";
import { LegalHeader, H2, P, UL, Note } from "@/components/site/legal";

export const metadata: Metadata = {
  title: "Refunds & Returns · Gauge Golf",
  description: "Refund policy, return window and process for Gauge Golf orders.",
  alternates: { canonical: "/refunds" },
};

export default function Refunds() {
  return (
    <article>
      <LegalHeader num="Legal · 04" title="Refunds & Returns" lastUpdated="May 14, 2026" />

      <P>
        We want every Gauge Golf customer to be happy. The policy below is intentionally simple and buyer-friendly.
      </P>

      <H2>1. Before shipping</H2>
      <P>
        You may cancel for any reason before the package is dispatched. Refund is issued within <strong className="text-white">7 business days</strong> to the original payment method, minus any non-recoverable transfer fees charged by the bank (typically zero for domestic Korean transfers, up to a few USD for international wires).
      </P>

      <H2>2. After delivery — defects</H2>
      <P>
        If the glove arrives with a manufacturing defect or shipping damage, contact <a className="text-gold hover:underline" href="mailto:hello@gauge-golf.com">hello@gauge-golf.com</a> within <strong className="text-white">14 days of delivery</strong> with:
      </P>
      <UL>
        <li>Photos of the defect.</li>
        <li>Photo of the package and label (for shipping damage).</li>
        <li>Your order details.</li>
      </UL>
      <P>
        We will offer at our choice: (a) full refund, or (b) free replacement on the next batch. Defective items do not need to be returned — please dispose of them responsibly.
      </P>

      <H2>3. After delivery — change of mind</H2>
      <P>
        Because this is a hand-made small-batch product made to order, change-of-mind returns are <strong className="text-white">accepted only if the glove is unused and in original condition</strong>, within 14 days of delivery.
      </P>
      <UL>
        <li>Return shipping is paid by the buyer.</li>
        <li>Refund is issued after we receive the glove and confirm condition.</li>
        <li>Original shipping cost is non-refundable.</li>
      </UL>

      <H2>4. Wrong size</H2>
      <P>
        If the size doesn&apos;t fit, contact us within 14 days. We will exchange for a different size from the next batch at no extra cost — buyer pays only the cost of returning the original glove.
      </P>

      <H2>5. Late or missing refunds</H2>
      <P>
        If a refund has been confirmed but you don&apos;t see it after 10 business days, please reply to the original email and we will investigate with the bank. International transfers can occasionally take up to 14 business days.
      </P>

      <H2>6. Non-refundable</H2>
      <UL>
        <li>Damage caused by normal practice wear or improper care.</li>
        <li>Used gloves outside the 14-day defect window.</li>
        <li>Customs duties or import VAT charged by your country.</li>
      </UL>

      <H2>7. How to start</H2>
      <P>
        Email <a className="text-gold hover:underline" href="mailto:hello@gauge-golf.com">hello@gauge-golf.com</a> with your order details and reason. We aim to reply within 48 hours.
      </P>

      <Note>
        Disputes are handled directly by the founder. No call centers, no scripted responses.
      </Note>
    </article>
  );
}
