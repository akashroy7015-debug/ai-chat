import { requireAdmin } from "@/lib/admin";
import { clipVersion, removeClip, uploadClip } from "@/lib/portraits";
import { db } from "@/lib/store";
import { authed, json } from "@/lib/http";

/** Admin uploads (or removes, with remove=1) a model's looping video clip. Multipart form: id, file. */
export const POST = authed(async (req, adminId) => {
  requireAdmin(adminId);
  const form = await req.formData().catch(() => null);
  const id = form?.get("id");
  if (typeof id !== "string") return json({ error: "id required" }, 400);
  const c = db.characters.get(id);
  if (!c?.featured) return json({ error: "Not found" }, 404);
  if (form?.get("remove")) { removeClip(id); return json({ ok: true }); }
  const file = form?.get("file");
  if (!(file instanceof Blob)) return json({ error: "file required" }, 400);
  try {
    uploadClip(adminId, c, Buffer.from(await file.arrayBuffer()));
    return json({ ok: true, clipV: clipVersion(id) });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
