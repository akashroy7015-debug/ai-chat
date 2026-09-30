import type { NextRequest } from "next/server";
import { CharacterInput } from "@/lib/characters/schema";
import { requireVerifiedAdult } from "@/lib/age/verification";
import { audit, db, newId } from "@/lib/store";
import { errorResponse, json, userIdFrom } from "@/lib/http";

export async function GET(req: NextRequest) {
  const id = userIdFrom(req);
  try {
    requireVerifiedAdult(id.userId);
    return json(id, { characters: [...db.characters.values()].filter((c) => c.ownerId === id.userId) });
  } catch (e) {
    return errorResponse(id, e);
  }
}

export async function POST(req: NextRequest) {
  const id = userIdFrom(req);
  try {
    requireVerifiedAdult(id.userId);
    const parsed = CharacterInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      audit({ userId: id.userId, kind: "character_rejected", detail: JSON.stringify(parsed.error.issues.map((i) => i.message)) });
      return json(id, { error: "Invalid character", issues: parsed.error.issues.map((i) => i.message) }, 422);
    }
    const character = { ...parsed.data, id: newId(), ownerId: id.userId, createdAt: Date.now() };
    db.characters.set(character.id, character);
    return json(id, { character }, 201);
  } catch (e) {
    return errorResponse(id, e);
  }
}
