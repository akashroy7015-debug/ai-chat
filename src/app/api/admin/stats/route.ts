import { growth, requireAdmin, stats } from "@/lib/admin";
import { authed, json } from "@/lib/http";

export const GET = authed(async (req, userId) => {
  requireAdmin(userId);
  return json(req.nextUrl.searchParams.get("growth") ? growth() : stats());
});
