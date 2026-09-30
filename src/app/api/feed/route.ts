import type { NextRequest } from "next/server";
import { feed, toggleLike } from "@/lib/feed";
import { sessionUser } from "@/lib/auth";
import { authed, body, json, SESSION_COOKIE } from "@/lib/http";

/** Public (SFW) feed; `liked` is filled in when logged in. */
export async function GET(req: NextRequest) {
  return json({ posts: feed(sessionUser(req.cookies.get(SESSION_COOKIE)?.value)) });
}

export const POST = authed(async (req, userId) => {
  const { postId } = await body<{ postId: string }>(req);
  if (typeof postId !== "string") return json({ error: "postId required" }, 400);
  return json({ liked: toggleLike(userId, postId) });
});
