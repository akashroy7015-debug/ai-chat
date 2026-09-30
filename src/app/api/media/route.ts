import { listMedia, MEDIA_COSTS, requestMedia, SCENES, type Scene } from "@/lib/media/jobs";
import { requireVerifiedAdult } from "@/lib/age/verification";
import { authed, body, json } from "@/lib/http";

export const GET = authed(async (req, userId) => {
  requireVerifiedAdult(userId);
  const characterId = req.nextUrl.searchParams.get("characterId") ?? undefined;
  return json({ media: listMedia(userId, characterId), scenes: Object.keys(SCENES), costs: MEDIA_COSTS });
});

export const POST = authed(async (req, userId) => {
  const b = await body<{ characterId: string; kind: string; scene: string }>(req);
  if (typeof b.characterId !== "string" || (b.kind !== "image" && b.kind !== "video") || typeof b.scene !== "string" || !(b.scene in SCENES)) {
    return json({ error: "characterId, kind (image|video) and a valid scene are required" }, 400);
  }
  const job = await requestMedia(userId, b.characterId, b.kind, b.scene as Scene);
  return json({ id: job.id, status: job.status }, 202);
});
