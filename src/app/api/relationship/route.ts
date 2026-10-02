import { relationship } from "@/lib/engagement";
import { authed, json } from "@/lib/http";

export const GET = authed(async (req, userId) => {
  const c = req.nextUrl.searchParams.get("characterId");
  if (!c) return json({ error: "characterId required" }, 400);
  return json(relationship(userId, c));
});
