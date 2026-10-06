import { requireAdmin } from "@/lib/admin";
import { postNow } from "@/lib/social";
import { authed, json } from "@/lib/http";

/** Admin: send a test social post now (Telegram and/or X, whichever keys are set). */
export const POST = authed(async (_req, adminId) => {
  requireAdmin(adminId);
  return json(await postNow());
});
