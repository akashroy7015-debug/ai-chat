import webpush, { type PushSubscription } from "web-push";
import { audit, db, PMap } from "./store";
import { ensureFeatured } from "./characters/featured";

const g = globalThis as unknown as { __kv?: PMap<{ v: string }>; __subs?: PMap<{ sub: PushSubscription; lastPushAt: number }> };
const kv: PMap<{ v: string }> = (g.__kv ??= new PMap(db.sql, "kv"));
const subs: PMap<{ sub: PushSubscription; lastPushAt: number }> = (g.__subs ??= new PMap(db.sql, "push_subs"));

/** VAPID keys are generated once and kept in the database, so there is nothing to configure. */
function vapid() {
  let pub = kv.get("vapid_public")?.v;
  let priv = kv.get("vapid_private")?.v;
  if (!pub || !priv) {
    const k = webpush.generateVAPIDKeys();
    kv.set("vapid_public", { v: k.publicKey });
    kv.set("vapid_private", { v: k.privateKey });
    pub = k.publicKey; priv = k.privateKey;
  }
  webpush.setVapidDetails(`mailto:${process.env.GRIEVANCE_OFFICER_EMAIL ?? "rizzlabsupport@gmail.com"}`, pub, priv);
  return pub;
}

export const publicKey = () => vapid();

export function subscribe(userId: string, sub: PushSubscription) {
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth) throw new Error("Invalid subscription");
  subs.set(userId, { sub, lastPushAt: subs.get(userId)?.lastPushAt ?? 0 });
}
export const unsubscribe = (userId: string) => { if (subs.has(userId)) subs.delete(userId); };
export const isSubscribed = (userId: string) => subs.has(userId);

const LINES = ["misses you 😘", "is waiting for you… 💕", "sent you a message 💌", "can't stop thinking about you 🙈", "wants to know how your day was ☺️"];
const HOUR = 3_600_000;

/** Nudge users who've been away 20h+, at most once a day, from the girl they talked to last. */
export async function notifyInactive(now = Date.now(), send = webpush.sendNotification) {
  vapid();
  ensureFeatured();
  let sent = 0;
  for (const [userId, s] of subs.entries()) {
    if (now - s.lastPushAt < 24 * HOUR) continue;
    let last: { characterId: string; at: number } | undefined;
    for (const m of db.messages) if (m.userId === userId && (!last || m.at > last.at)) last = m;
    if (!last || now - last.at < 20 * HOUR) continue;
    const c = db.characters.get(last.characterId);
    if (!c) continue;
    const first = c.name.split(" ")[0];
    const body = `${first} ${LINES[Math.floor(now / HOUR + userId.length) % LINES.length]}`;
    try {
      await send(s.sub, JSON.stringify({ title: "Sizzly", body, url: `/chat?c=${c.id}`, icon: `/api/portraits/${c.id}` }));
      subs.set(userId, { ...s, lastPushAt: now });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) subs.delete(userId); // subscription expired
      else audit({ userId, kind: "push_failed", detail: String(code ?? e) });
    }
  }
  return sent;
}
