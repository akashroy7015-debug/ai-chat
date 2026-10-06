import type { MetadataRoute } from "next";
import { listFeatured } from "@/lib/characters/featured";

const BASE = "https://flirtiq.online";
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/girls", "/ai-girlfriend-india", "/replika-alternative", "/premium", "/discover", "/swipe", "/terms", "/privacy", "/refund", "/contact", "/grievance"];
  const girls = listFeatured().filter((c) => c.gender === "female").map((c) => `/girls/${c.id}`);
  return [...pages, ...girls].map((p) => ({ url: `${BASE}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : p.startsWith("/girls") || p.includes("-") ? 0.8 : 0.5 }));
}
