import { requireAdmin } from "@/lib/admin";
import { listPending, manualReview, reviewPending } from "@/lib/portraits";
import { authed, body, json } from "@/lib/http";

export const GET = authed(async (_req, userId) => {
  requireAdmin(userId);
  return json({ manual: manualReview(), pending: listPending() });
});

export const POST = authed(async (req, adminId) => {
  requireAdmin(adminId);
  const b = await body<{ id: string; approve: boolean }>(req);
  if (typeof b.id !== "string" || typeof b.approve !== "boolean") return json({ error: "id and approve required" }, 400);
  try { reviewPending(adminId, b.id, b.approve); } catch (e) { return json({ error: e instanceof Error ? e.message : String(e) }, 400); }
  return json({ ok: true });
});
