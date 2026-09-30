import { requireAdmin } from "@/lib/admin";
import { addPost, deletePost } from "@/lib/feed";
import { authed, body, json } from "@/lib/http";

export const POST = authed(async (req, adminId) => {
  requireAdmin(adminId);
  const b = await body<{ characterId: string; text: string; deleteId: string }>(req);
  if (typeof b.deleteId === "string") { deletePost(b.deleteId); return json({ ok: true }); }
  try {
    return json({ post: addPost(String(b.characterId ?? ""), String(b.text ?? "")) }, 201);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
