import { reports, requireAdmin, resolveReport } from "@/lib/admin";
import { authed, body, json } from "@/lib/http";

export const GET = authed(async (_req, userId) => {
  requireAdmin(userId);
  return json({ reports: reports() });
});

export const POST = authed(async (req, adminId) => {
  requireAdmin(adminId);
  const b = await body<{ id: string; restore: boolean }>(req);
  if (typeof b.id !== "string") return json({ error: "id required" }, 400);
  resolveReport(adminId, b.id, b.restore === true);
  return json({ ok: true });
});
