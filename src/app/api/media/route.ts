import type { NextRequest } from "next/server";
import { listMedia, MEDIA_COSTS, requestMedia, SCENES, type Scene } from "@/lib/media/jobs";
import { errorResponse, json, userIdFrom } from "@/lib/http";
import { requireVerifiedAdult } from "@/lib/age/verification";

export async function GET(req: NextRequest) {
  const id = userIdFrom(req);
  try {
    requireVerifiedAdult(id.userId);
    const characterId = req.nextUrl.searchParams.get("characterId") ?? undefined;
    return json(id, { media: listMedia(id.userId, characterId), scenes: Object.keys(SCENES), costs: MEDIA_COSTS });
  } catch (e) {
    return errorResponse(id, e);
  }
}

export async function POST(req: NextRequest) {
  const id = userIdFrom(req);
  try {
    const b = (await req.json().catch(() => ({}))) as { characterId?: string; kind?: string; scene?: string };
    if (typeof b.characterId !== "string" || (b.kind !== "image" && b.kind !== "video") || typeof b.scene !== "string" || !(b.scene in SCENES)) {
      return json(id, { error: "characterId, kind (image|video) and a valid scene are required" }, 400);
    }
    const job = await requestMedia(id.userId, b.characterId, b.kind, b.scene as Scene);
    return json(id, { id: job.id, status: job.status }, 202);
  } catch (e) {
    return errorResponse(id, e);
  }
}
