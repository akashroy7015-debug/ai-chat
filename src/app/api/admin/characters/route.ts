import { requireAdmin } from "@/lib/admin";
import { allFeatured, createFeatured, setFeaturedHidden, updateFeatured } from "@/lib/characters/featured";
import { generatePortrait, portraitVersion } from "@/lib/portraits";
import { audit, db } from "@/lib/store";
import { authed, body, json } from "@/lib/http";
import { ZodError } from "zod";

export const GET = authed(async (_req, userId) => {
  requireAdmin(userId);
  return json({ characters: allFeatured().map((c) => ({ ...c, portraitV: portraitVersion(c.id) })) });
});

type Body = { action: "create" | "update" | "hide" | "show" | "portrait"; id: string; character: unknown };

export const POST = authed(async (req, adminId) => {
  requireAdmin(adminId);
  const b = await body<Body>(req);
  try {
    if (b.action === "create") {
      const c = createFeatured(b.character);
      audit({ userId: adminId, kind: "admin_model_created", detail: c.id });
      return json({ character: c }, 201);
    }
    if (typeof b.id !== "string") return json({ error: "id required" }, 400);
    if (b.action === "update") {
      const c = updateFeatured(b.id, b.character);
      audit({ userId: adminId, kind: "admin_model_updated", detail: c.id });
      return json({ character: c });
    }
    if (b.action === "hide" || b.action === "show") {
      setFeaturedHidden(b.id, b.action === "hide");
      return json({ ok: true });
    }
    if (b.action === "portrait") {
      const c = db.characters.get(b.id);
      if (!c?.featured) return json({ error: "Not found" }, 404);
      await generatePortrait(c);
      return json({ ok: true, portraitV: portraitVersion(c.id) });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    if (e instanceof ZodError) return json({ error: e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, 422);
    return json({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
