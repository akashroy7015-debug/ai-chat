import { vote } from "@/lib/feedback";
import { authed, body, json } from "@/lib/http";

export const POST = authed(async (req, userId) => {
  const b = await body<{ messageId: string; vote: number }>(req);
  if (typeof b.messageId !== "string" || (b.vote !== 1 && b.vote !== -1)) return json({ error: "messageId and vote (1 or -1) required" }, 400);
  return json({ vote: vote(userId, b.messageId, b.vote) });
});
