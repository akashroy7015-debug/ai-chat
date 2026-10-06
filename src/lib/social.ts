import { createHmac, randomBytes } from "node:crypto";
import { listFeatured } from "./characters/featured";
import { hasPortrait } from "./portraits";
import { audit, db, PMap } from "./store";
import type { Character } from "./characters/schema";

/**
 * Daily auto-post: once a day (around 8 pm India time) a featured model is posted to the
 * Telegram channel and/or X account that are configured on the server. Each network is
 * skipped when its keys are missing.
 */
const SITE = "https://flirtiq.online";
const POST_HOUR_IST = 20;
const g = globalThis as unknown as { __social?: PMap<{ at: number; model: string }> };
const log: PMap<{ at: number; model: string }> = (g.__social ??= new PMap(db.sql, "social_log"));

const CAPTIONS = [
  (n: string) => `${n} is online right now 🟢 and she's in a mood today… say hi 😏`,
  (n: string) => `${n} texts back in English or Hinglish, whatever you're in the mood for 🙈`,
  (n: string) => `${n} remembers your name, your day and that girl who ghosted you 💘`,
  (n: string) => `POV: you text ${n} "hi" and she replies "finally! I was waiting for you" 😳`,
  (n: string) => `Can't sleep? ${n} stays up late too 🌙 Talk till sunrise.`,
  (n: string) => `${n} just sent you a voice note 🔊 Open it before she gets jealous.`,
  (n: string) => `Swipe right on ${n}? 💘 It's a match waiting to happen.`,
];

const istDay = (t: number) => new Date(t + 5.5 * 3600_000).toISOString().slice(0, 10);
const istHour = (t: number) => new Date(t + 5.5 * 3600_000).getUTCHours();

/** Picks the model and caption for a given day, rotating through models that have photos. */
export function dailyPost(now = Date.now(), models: Character[] = listFeatured({ category: "girls" }).filter((c) => hasPortrait(c.id))) {
  if (!models.length) return null;
  const day = Math.floor((now + 5.5 * 3600_000) / 86_400_000);
  const c = models[day % models.length];
  const name = c.name.split(" ")[0];
  const caption = CAPTIONS[day % CAPTIONS.length](name);
  const link = (src: string) => `${SITE}/girls/${c.id}?utm_source=${src}`;
  return { model: c, name, caption, link };
}

async function telegram(p: NonNullable<ReturnType<typeof dailyPost>>, fetchImpl: typeof fetch) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHANNEL;
  if (!token || !chat) return "skipped";
  const r = await fetchImpl(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chat,
      photo: `${SITE}/api/portraits/${p.model.id}?w=640`,
      caption: `${p.caption}\n\n💬 Chat with ${p.name} free → ${p.link("telegram")}\n18+ · AI-generated character`,
    }),
  });
  return r.ok ? "ok" : `error ${r.status}`;
}

const pct = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);

/** OAuth 1.0a header for X API v2 (user context). */
export function oauthHeader(method: string, url: string, keys: { ck: string; cs: string; at: string; as: string }, nonce = randomBytes(16).toString("hex"), ts = Math.floor(Date.now() / 1000).toString()) {
  const params: Record<string, string> = { oauth_consumer_key: keys.ck, oauth_nonce: nonce, oauth_signature_method: "HMAC-SHA1", oauth_timestamp: ts, oauth_token: keys.at, oauth_version: "1.0" };
  const base = [method, pct(url), pct(Object.keys(params).sort().map((k) => `${pct(k)}=${pct(params[k])}`).join("&"))].join("&");
  params.oauth_signature = createHmac("sha1", `${pct(keys.cs)}&${pct(keys.as)}`).update(base).digest("base64");
  return "OAuth " + Object.keys(params).sort().map((k) => `${pct(k)}="${pct(params[k])}"`).join(", ");
}

async function x(p: NonNullable<ReturnType<typeof dailyPost>>, fetchImpl: typeof fetch) {
  const keys = { ck: process.env.X_API_KEY ?? "", cs: process.env.X_API_SECRET ?? "", at: process.env.X_ACCESS_TOKEN ?? "", as: process.env.X_ACCESS_SECRET ?? "" };
  if (!keys.ck || !keys.cs || !keys.at || !keys.as) return "skipped";
  const url = "https://api.x.com/2/tweets";
  const r = await fetchImpl(url, {
    method: "POST",
    headers: { authorization: oauthHeader("POST", url, keys), "content-type": "application/json" },
    body: JSON.stringify({ text: `${p.caption}\n\n${p.link("twitter")}\n#AIgirlfriend #AICompanion #AIchat` }),
  });
  return r.ok ? "ok" : `error ${r.status}`;
}

/** Runs from the hourly job: posts once per day after 8 pm IST. Safe to call often. */
export async function maybePostDaily(now = Date.now(), fetchImpl: typeof fetch = fetch) {
  const day = istDay(now);
  if (istHour(now) < POST_HOUR_IST || log.get(day)) return null;
  const p = dailyPost(now);
  if (!p) return null;
  log.set(day, { at: now, model: p.model.id });
  const result = { telegram: await telegram(p, fetchImpl).catch((e) => `error ${e}`), x: await x(p, fetchImpl).catch((e) => `error ${e}`) };
  if (result.telegram === "skipped" && result.x === "skipped") { log.delete(day); return result; }
  audit({ userId: "system", kind: "social_post", detail: `${p.model.id} telegram=${result.telegram} x=${result.x}` });
  return result;
}

/** Admin test: post today's model right now to every configured network. */
export async function postNow(fetchImpl: typeof fetch = fetch) {
  const p = dailyPost();
  if (!p) return { error: "No models with photos yet" };
  const result = { telegram: await telegram(p, fetchImpl).catch((e) => `error ${e}`), x: await x(p, fetchImpl).catch((e) => `error ${e}`) };
  audit({ userId: "system", kind: "social_post_test", detail: `${p.model.id} telegram=${result.telegram} x=${result.x}` });
  return { model: p.name, ...result };
}
