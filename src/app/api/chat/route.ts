import { handleChat } from "@/lib/chat";
import { authed, body, json } from "@/lib/http";

export const POST = authed(async (req, userId) => {
  const b = await body<{ characterId: string; message: string }>(req);
  if (typeof b.characterId !== "string" || typeof b.message !== "string") {
    return json({ error: "characterId and message are required" }, 400);
  }
  return json(await handleChat(userId, b.characterId, b.message));
});
