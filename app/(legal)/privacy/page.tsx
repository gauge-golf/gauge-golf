import type { Metadata } from "next";
import { LegalHeader, H2, P, UL, Note } from "@/components/site/legal";

export const metadata: Metadata = {
  title: "Privacy Policy · Gauge Golf",
  description: "How Gauge Golf collects, uses and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <article>
      <LegalHeader num="Legal · 01" title="Privacy Policy" lastUpdated="May 14, 2026" />

      <P>
        Gauge Golf is operated by an individual (Konstantin Kazarichuk), not by a registered legal entity. This Privacy Policy explains what information is collected when you use this website or submit the early-access form, and how it is handled.
      </P>

      <H2>1. What we collect</H2>
      <P>When you submit the early-access form, the following information is stored:</P>
      <UL>
        <li><strong className="text-white">Required:</strong> name, email, country.</li>
        <li><strong className="text-white">Optional:</strong> state or city, glove hand, glove size, Instagram / X handle, handicap, message.</li>
        <li><strong className="text-white">Technical:</strong> IP address (derived from request), user-agent string, referring URL. Used only to detect spam and abuse.</li>
      </UL>
      <P>No payment information, identity documents, or sensitive personal data are collected through this website.</P>

      <H2>2. How we use it</H2>
      <UL>
        <li>To reply to your early-access request personally.</li>
        <li>To send first-batch availability and shipping updates by email.</li>
        <li>To improve the product based on size, region, and feedback patterns.</li>
      </UL>
      <P>
        Your data is <strong className="text-white">never sold or shared with third parties</strong> for marketing or advertising. We do not run advertising on this site.
      </P>

      <H2>3. Where it&apos;s stored</H2>
      <P>
        Form submissions are stored in a Postgres database hosted by Neon (neon.com). The website is hosted by Vercel (vercel.com). Both providers offer industry-standard encryption in transit (HTTPS / TLS) and at rest.
      </P>

      <H2>4. Cookies & tracking</H2>
      <P>
        This site does not set tracking cookies, does not use third-party advertising pixels, and does not include analytics that profile individual visitors. Embedded YouTube videos load via youtube-nocookie.com only after you click play.
      </P>

      <H2>5. Your rights</H2>
      <P>You can at any time, by emailing <a className="text-gold hover:underline" href="mailto:hello@gauge-golf.com">hello@gauge-golf.com</a>, request to:</P>
      <UL>
        <li>Receive a copy of the data we hold about you.</li>
        <li>Correct inaccurate information.</li>
        <li>Delete your record entirely.</li>
        <li>Unsubscribe from future emails.</li>
      </UL>
      <P>Requests are processed within 14 days.</P>

      <H2>6. Retention</H2>
      <P>
        Records are kept until you request deletion, or for up to 24 months after your last interaction — whichever comes first. Records linked to an actual order are kept for 5 years for tax and customs purposes, then deleted.
      </P>

      <H2>7. International users</H2>
      <P>
        This service is operated by an individual based in Indonesia, with order fulfillment from the Republic of Korea starting June 5, 2026. By submitting the form, you acknowledge that your data may be processed outside your country of residence. Where applicable (EU GDPR, Korea PIPA, Japan APPI, etc.), the rights listed in Section 5 are honored on request.
      </P>

      <H2>8. Changes to this policy</H2>
      <P>
        Material changes will be posted on this page with an updated date. Continued use of the site after changes constitutes acceptance.
      </P>

      <H2>9. Contact</H2>
      <P>
        Konstantin Kazarichuk · <a className="text-gold hover:underline" href="mailto:hello@gauge-golf.com">hello@gauge-golf.com</a>
      </P>

      <Note>
        This policy is provided in good faith as the operating standard of an individual seller, not as legal advice.
      </Note>
    </article>
  );
}
