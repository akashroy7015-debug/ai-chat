import { reportMedia } from "@/lib/media/jobs";
import { authed, body, json } from "@/lib/http";

export const POST = authed(async (req, userId) => {
  const b = await body<{ id: string; reason: string }>(req);
  if (typeof b.id !== "string") return json({ error: "id required" }, 400);
  reportMedia(userId, b.id, String(b.reason ?? ""));
  return json({ ok: true });
});
