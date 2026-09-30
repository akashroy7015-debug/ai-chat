import { requireAdmin, stats } from "@/lib/admin";
import { authed, json } from "@/lib/http";

export const GET = authed(async (_req, userId) => {
  requireAdmin(userId);
  return json(stats());
});
