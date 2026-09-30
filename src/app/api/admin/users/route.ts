import { grantTokens, listUsers, requireAdmin, setBanned } from "@/lib/admin";
import { authed, body, json } from "@/lib/http";

export const GET = authed(async (req, userId) => {
  requireAdmin(userId);
  return json({ users: listUsers(req.nextUrl.searchParams.get("q") ?? "") });
});

export const POST = authed(async (req, adminId) => {
  requireAdmin(adminId);
  const b = await body<{ userId: string; action: "ban" | "unban" | "grant"; amount: number }>(req);
  if (typeof b.userId !== "string") return json({ error: "userId required" }, 400);
  if (b.action === "ban" || b.action === "unban") setBanned(adminId, b.userId, b.action === "ban");
  else if (b.action === "grant" && Number.isInteger(b.amount) && b.amount! > 0 && b.amount! <= 100_000) grantTokens(adminId, b.userId, b.amount!);
  else return json({ error: "invalid action" }, 400);
  return json({ ok: true });
});
