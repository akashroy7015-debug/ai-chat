import { CharacterInput } from "@/lib/characters/schema";
import { requireVerifiedAdult } from "@/lib/age/verification";
import { audit, db, newId } from "@/lib/store";
import { authed, json } from "@/lib/http";

export const GET = authed(async (_req, userId) => {
  requireVerifiedAdult(userId);
  return json({ characters: [...db.characters.values()].filter((c) => c.ownerId === userId) });
});

export const POST = authed(async (req, userId) => {
  requireVerifiedAdult(userId);
  const parsed = CharacterInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    audit({ userId, kind: "character_rejected", detail: JSON.stringify(parsed.error.issues.map((i) => i.message)) });
    return json({ error: "Invalid character", issues: parsed.error.issues.map((i) => i.message) }, 422);
  }
  const character = { ...parsed.data, id: newId(), ownerId: userId, createdAt: Date.now() };
  db.characters.set(character.id, character);
  return json({ character }, 201);
});
