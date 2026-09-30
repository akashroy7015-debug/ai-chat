import { recentAudit, requireAdmin } from "@/lib/admin";
import { authed, json } from "@/lib/http";

export const GET = authed(async (req, userId) => {
  requireAdmin(userId);
  return json({ audit: recentAudit(150, req.nextUrl.searchParams.get("kind") ?? undefined) });
});
