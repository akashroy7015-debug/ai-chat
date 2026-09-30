import { listConversations } from "@/lib/conversations";
import { requireVerifiedAdult } from "@/lib/age/verification";
import { authed, json } from "@/lib/http";

export const GET = authed(async (_req, userId) => {
  requireVerifiedAdult(userId);
  return json({ conversations: listConversations(userId) });
});
