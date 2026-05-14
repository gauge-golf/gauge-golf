import type { Metadata } from "next";
import { LegalHeader, H2, P, UL, Note } from "@/components/site/legal";

export const metadata: Metadata = {
  title: "Shipping & Delivery · Gauge Golf",
  description: "How Gauge Golf ships orders worldwide, timelines, customs and tracking.",
  alternates: { canonical: "/shipping" },
};

export default function Shipping() {
  return (
    <article>
      <LegalHeader num="Legal · 03" title="Shipping & Delivery" lastUpdated="May 14, 2026" />

      <P>
        Every Gauge Golf order is fulfilled personally by the founder. There is no warehouse and no third-party 3PL — only careful, slow, hand-packed shipping.
      </P>

      <H2>1. Where we ship from</H2>
      <P>
        From <strong className="text-white">June 5, 2026</strong>, orders are shipped from <strong className="text-white">the Republic of Korea</strong>. Earlier orders (April–May 2026) were shipped from Indonesia and noted as such in the order confirmation.
      </P>

      <H2>2. Where we ship to</H2>
      <P>
        Worldwide, with priority for: South Korea, Japan, Singapore, United States, Indonesia. Other destinations are available — please confirm by email before payment.
      </P>

      <H2>3. Shipping method</H2>
      <P>Tracked international post (Korea Post EMS or equivalent). Tracking number is shared by email at dispatch.</P>

      <H2>4. Estimated delivery times</H2>
      <UL>
        <li><strong className="text-white">South Korea:</strong> 2–4 business days.</li>
        <li><strong className="text-white">Japan, Singapore:</strong> 4–7 business days.</li>
        <li><strong className="text-white">Hong Kong, Taiwan, Southeast Asia:</strong> 5–10 business days.</li>
        <li><strong className="text-white">United States, Canada, Australia:</strong> 7–14 business days.</li>
        <li><strong className="text-white">Europe, Middle East:</strong> 10–18 business days.</li>
        <li><strong className="text-white">Rest of world:</strong> 14–25 business days.</li>
      </UL>
      <P>Times are estimates from dispatch, not from order date. They exclude customs delays.</P>

      <H2>5. Shipping cost</H2>
      <P>
        Quoted by email before payment, based on destination and weight. The seller does not profit from shipping — it is passed at cost.
      </P>

      <H2>6. Customs, duties & taxes</H2>
      <P>
        Customs duties, import VAT and local taxes are the <strong className="text-white">buyer&apos;s responsibility</strong>. The package is declared honestly at its commercial value (USD $19) and labeled as &quot;sports accessory · golf glove&quot;. We do not under-declare values.
      </P>

      <H2>7. Lost or undelivered packages</H2>
      <UL>
        <li>If tracking shows no movement for 14+ days, contact us — we will open an investigation with the postal carrier.</li>
        <li>If the package is not delivered within <strong className="text-white">60 days from dispatch</strong>, we will refund or re-ship at our cost.</li>
        <li>Packages marked &quot;delivered&quot; by the carrier are considered delivered. We cannot refund stolen-after-delivery cases but will help with carrier claims where possible.</li>
      </UL>

      <H2>8. Wrong address</H2>
      <P>
        Please double-check your shipping address before payment. Reshipping due to an incorrect address provided by the buyer is at the buyer&apos;s cost.
      </P>

      <H2>9. Local pickup</H2>
      <P>
        For buyers in <strong className="text-white">Seoul, Republic of Korea</strong>, in-person handover is available by appointment. Email to arrange.
      </P>

      <Note>
        Shipping is handled by one person, not a fulfillment center. Honest communication beats unrealistic promises — please reach out anytime if anything is unclear.
      </Note>
    </article>
  );
}
