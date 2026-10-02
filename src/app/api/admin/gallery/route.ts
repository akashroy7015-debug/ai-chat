import { requireAdmin } from "@/lib/admin";
import { addGalleryItem, removeGalleryItem } from "@/lib/gallery";
import { db } from "@/lib/store";
import { authed, json } from "@/lib/http";

/** Admin adds Premium gallery files (multipart: id, file…) or removes one (remove=<itemId>). */
export const POST = authed(async (req, adminId) => {
  requireAdmin(adminId);
  const form = await req.formData().catch(() => null);
  const remove = form?.get("remove");
  if (typeof remove === "string") { removeGalleryItem(adminId, remove); return json({ ok: true }); }
  const id = form?.get("id");
  const c = typeof id === "string" ? db.characters.get(id) : undefined;
  if (!c?.featured) return json({ error: "Not found" }, 404);
  const files = (form?.getAll("file") ?? []).filter((f): f is File => f instanceof Blob);
  if (!files.length) return json({ error: "file required" }, 400);
  const errors: string[] = [];
  let added = 0;
  for (const f of files) {
    try { addGalleryItem(adminId, c, Buffer.from(await f.arrayBuffer())); added++; } catch (e) { errors.push(`${f.name}: ${e instanceof Error ? e.message : e}`); }
  }
  return json({ ok: errors.length === 0, added, errors }, added ? 200 : 400);
});
