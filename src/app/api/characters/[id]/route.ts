import type { NextRequest } from "next/server";
import { requireVerifiedAdult } from "@/lib/age/verification";
import { ensureFeatured } from "@/lib/characters/featured";
import { canChatWith } from "@/lib/characters/schema";
import { db } from "@/lib/store";
import { errorResponse, json, userIdFrom } from "@/lib/http";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = userIdFrom(req);
  try {
    requireVerifiedAdult(id.userId);
    ensureFeatured();
    const c = db.characters.get((await params).id);
    if (!c || !canChatWith(c, id.userId)) return json(id, { error: "Character not found" }, 404);
    return json(id, { character: c });
  } catch (e) {
    return errorResponse(id, e);
  }
}
