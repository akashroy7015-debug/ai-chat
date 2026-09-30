import { requireAdmin } from "@/lib/admin";
import { portraitVersion, uploadPortrait } from "@/lib/portraits";
import { db } from "@/lib/store";
import { authed, json } from "@/lib/http";

/** Admin uploads a model picture made with any image tool (multipart form: id, file). */
export const POST = authed(async (req, adminId) => {
  requireAdmin(adminId);
  const form = await req.formData().catch(() => null);
  const id = form?.get("id");
  const file = form?.get("file");
  if (typeof id !== "string" || !(file instanceof Blob)) return json({ error: "id and file required" }, 400);
  const c = db.characters.get(id);
  if (!c?.featured) return json({ error: "Not found" }, 404);
  try {
    uploadPortrait(adminId, c, Buffer.from(await file.arrayBuffer()));
    return json({ ok: true, portraitV: portraitVersion(id) });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
