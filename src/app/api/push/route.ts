import { isSubscribed, publicKey, subscribe, unsubscribe } from "@/lib/push";
import { authed, body, json } from "@/lib/http";
import type { PushSubscription } from "web-push";

export const GET = authed(async (_req, userId) => json({ publicKey: publicKey(), subscribed: isSubscribed(userId) }));
export const POST = authed(async (req, userId) => {
  const b = await body<{ subscription: PushSubscription }>(req);
  try { subscribe(userId, b.subscription as PushSubscription); } catch (e) { return json({ error: (e as Error).message }, 400); }
  return json({ subscribed: true });
});
export const DELETE = authed(async (_req, userId) => { unsubscribe(userId); return json({ subscribed: false }); });
