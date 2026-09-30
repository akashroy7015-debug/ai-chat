import type { NextRequest } from "next/server";
import { handleChat } from "@/lib/chat";
import { errorResponse, json, userIdFrom } from "@/lib/http";

export async function POST(req: NextRequest) {
  const id = userIdFrom(req);
  try {
    const body = (await req.json().catch(() => ({}))) as { characterId?: string; message?: string };
    if (typeof body.characterId !== "string" || typeof body.message !== "string") {
      return json(id, { error: "characterId and message are required" }, 400);
    }
    return json(id, await handleChat(id.userId, body.characterId, body.message));
  } catch (e) {
    return errorResponse(id, e);
  }
}
