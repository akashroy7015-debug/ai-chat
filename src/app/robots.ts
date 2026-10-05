import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/chat", "/chats", "/my-ai"] }], sitemap: "https://flirtiq.online/sitemap.xml" };
}
