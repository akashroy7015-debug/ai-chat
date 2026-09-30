import { requireVerifiedAdult } from "@/lib/age/verification";
import { ensureFeatured } from "@/lib/characters/featured";
import { canChatWith } from "@/lib/characters/schema";
import { db } from "@/lib/store";
import { authed, json } from "@/lib/http";

export const GET = authed<{ id: string }>(async (_req, userId, { params }) => {
  requireVerifiedAdult(userId);
  ensureFeatured();
  const c = db.characters.get((await params).id);
  if (!c || !canChatWith(c, userId)) return json({ error: "Character not found" }, 404);
  return json({ character: c });
});
