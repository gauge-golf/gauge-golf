import type { Metadata } from "next";
import { LegalHeader, H2, P, UL, Note } from "@/components/site/legal";

export const metadata: Metadata = {
  title: "Terms of Sale · Gauge Golf",
  description: "Terms governing pre-orders and sales of Gauge Golf products.",
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <article>
      <LegalHeader num="Legal · 02" title="Terms of Sale" lastUpdated="May 14, 2026" />

      <P>
        These terms govern any early-access reservation or pre-order placed with Gauge Golf. By submitting the early-access form or placing an order, you agree to the terms below.
      </P>

      <H2>1. Who we are</H2>
      <P>
        Gauge Golf is operated by Konstantin Kazarichuk, an individual seller. It is <strong className="text-white">not a registered company</strong>. Orders are handled personally by the founder until a legal entity is incorporated.
      </P>
      <UL>
        <li>Residence: Indonesia (KITAS holder).</li>
        <li>Operations & fulfillment from: Republic of Korea, starting June 5, 2026.</li>
        <li>Contact: <a className="text-gold hover:underline" href="mailto:hello@gauge-golf.com">hello@gauge-golf.com</a></li>
      </UL>

      <H2>2. Pre-order nature</H2>
      <P>
        Gauge Golf is currently a <strong className="text-white">pre-order product</strong>. Submitting the form is a reservation of interest, not a binding purchase. A separate payment request will be sent before production. Production is launched only after a minimum batch threshold is reached.
      </P>

      <H2>3. Pricing</H2>
      <P>
        Indicative price is <strong className="text-white">USD $19 per glove</strong>, excluding shipping, customs duties and local taxes. The final price quoted at the time of payment request applies. Prices may change for future batches.
      </P>

      <H2>4. Payment</H2>
      <UL>
        <li>Payment is requested by direct email once your order is confirmed and ready for production.</li>
        <li>Accepted methods: bank transfer (Indonesian bank for the first batch, Korean bank once registered locally) and other methods the seller may add in writing.</li>
        <li>Orders are confirmed only after funds are received.</li>
      </UL>

      <H2>5. Cancellation</H2>
      <UL>
        <li>You may cancel any time <strong className="text-white">before payment</strong> at no cost.</li>
        <li>After payment but <strong className="text-white">before shipping</strong>: full refund within 7 business days, no reason required.</li>
        <li>After shipping: see <a className="text-gold hover:underline" href="/refunds">Refund Policy</a>.</li>
      </UL>

      <H2>6. Delivery</H2>
      <P>
        Shipping terms, estimated timelines, customs responsibility and lost-package handling are described in the <a className="text-gold hover:underline" href="/shipping">Shipping Policy</a>.
      </P>

      <H2>7. Product nature & warranty</H2>
      <P>
        Gauge Golf gloves are crafted in small batches. Minor variations in stitching, color and finish are normal and do not constitute defects. The seller warrants only that the glove is free of manufacturing defects on arrival.
      </P>
      <P>
        No warranty is given against wear from normal practice use, accidental damage, improper care, or use outside of the product&apos;s intended purpose.
      </P>

      <H2>8. Limitation of liability</H2>
      <P>
        To the maximum extent permitted by applicable law, the seller&apos;s total liability for any claim related to a Gauge Golf product is limited to <strong className="text-white">the amount actually paid by the buyer</strong> for that product. The seller is not liable for indirect, incidental or consequential damages.
      </P>

      <H2>9. Force majeure</H2>
      <P>
        The seller is not responsible for delays or failures caused by events outside reasonable control, including customs holds, postal disruptions, natural disasters, public health events, or supplier failures. In such cases the seller will communicate transparently and offer a refund or rescheduled delivery.
      </P>

      <H2>10. Governing law & disputes</H2>
      <P>
        These terms are governed by the laws of the Republic of Korea, where the seller operates from June 5, 2026. Disputes will first be resolved by good-faith communication directly with the founder. If unresolved within 30 days, the competent courts of Seoul, Republic of Korea, shall have exclusive jurisdiction, subject to any mandatory consumer-protection rights you may have in your country of residence.
      </P>

      <H2>11. Changes</H2>
      <P>
        These terms may be updated. The version in force is the one published on this page on the date of your order.
      </P>

      <Note>
        These terms are operating policies of an individual seller, not legal advice. For jurisdiction-specific consumer rights, please consult local regulations.
      </Note>
    </article>
  );
}
