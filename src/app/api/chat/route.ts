import { handleChat } from "@/lib/chat";
import { openConversation } from "@/lib/conversations";
import { authed, body, json } from "@/lib/http";

export const POST = authed(async (req, userId) => {
  const b = await body<{ characterId: string; message: string }>(req);
  if (typeof b.characterId !== "string" || typeof b.message !== "string") {
    return json({ error: "characterId and message are required" }, 400);
  }
  return json(await handleChat(userId, b.characterId, b.message));
});

/** Chat history for one character (adds the character's proactive message when due). */
export const GET = authed(async (req, userId) => {
  const characterId = req.nextUrl.searchParams.get("characterId");
  if (!characterId) return json({ error: "characterId required" }, 400);
  return json({ messages: openConversation(userId, characterId) });
});
