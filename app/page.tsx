import type { Metadata } from "next";
import { Coach } from "@/components/site/coach";

export const metadata: Metadata = {
  title: "Coach — Start Practice in 10 Seconds",
  description:
    "Pick your practice type and start training instantly. No login, no email. Just tap and play.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <Coach />;
}
