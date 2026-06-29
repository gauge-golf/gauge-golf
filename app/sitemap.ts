import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://gauge-golf.com";
  const now = new Date();
  return [
    {
      url: `${base}/glove`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: { languages: { en: `${base}/glove`, ko: `${base}/ko` } },
    },
    {
      url: `${base}/ko`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: { en: `${base}/glove`, ko: `${base}/ko` } },
    },
    { url: `${base}/privacy`,  lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/terms`,    lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/shipping`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/refunds`,  lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/imprint`,  lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
  ];
}
