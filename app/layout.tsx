import type { Metadata, Viewport } from "next";
import { Saira, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const saira = Saira({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-saira",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

const SITE_URL = "https://gauge-golf.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Gauge Golf — One Glove. Every Condition.",
  description:
    "A universal performance golf glove designed for grip, wrist stability and long practice sessions in heat, rain and all-weather training.",
  keywords: [
    "golf glove",
    "performance golf glove",
    "all-weather golf glove",
    "driving range glove",
    "wrist stability glove",
    "Gauge Golf",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Gauge Golf — One Glove. Every Condition.",
    description: "Universal performance golf glove. Built in public.",
    type: "website",
    url: SITE_URL,
    siteName: "Gauge Golf",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Gauge Golf" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gauge Golf — One Glove. Every Condition.",
    description: "Universal performance golf glove. Built in public.",
    images: ["/og.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000F19",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Gauge Golf",
  url: SITE_URL,
  logo: `${SITE_URL}/media/logo-main-gauge.svg`,
  email: "hello@gauge-golf.com",
  founder: { "@type": "Person", name: "Konstantin Kazarichuk" },
  description:
    "Universal performance golf glove for repetitive practice in heat, rain and all-weather training.",
  sameAs: [
    "https://www.instagram.com/kosta_golf",
    "https://youtube.com/@gauge-golf",
    "https://www.tiktok.com/@kazarichuk",
    "https://www.facebook.com/share/18iQdmxpL7/",
  ],
  telephone: "+62-812-2529-0989",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${saira.variable} ${mono.variable}`}>
      <head>
        {/* Pretendard — premium Korean web font (active when html[lang="ko"]) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        <link rel="alternate" hrefLang="en" href={SITE_URL} />
        <link rel="alternate" hrefLang="ko" href={`${SITE_URL}/ko`} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
