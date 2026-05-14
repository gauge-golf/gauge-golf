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

export const metadata: Metadata = {
  title: "Gauge Golf — One Glove. Every Condition.",
  description:
    "A universal performance golf glove designed for grip, wrist stability and long practice sessions.",
  openGraph: {
    title: "Gauge Golf — One Glove. Every Condition.",
    description: "Universal performance golf glove. Built in public.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000F19",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${saira.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
