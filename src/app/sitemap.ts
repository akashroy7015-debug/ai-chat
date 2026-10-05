import type { MetadataRoute } from "next";

const BASE = "https://flirtiq.online";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/premium", "/discover", "/swipe", "/terms", "/privacy", "/refund", "/contact", "/grievance"].map((p) => ({ url: `${BASE}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.5 }));
}
