import { detectSelfHarm, moderateText, SELF_HARM_RESPONSE } from "./moderation";
import { getLLM, type ChatTurn } from "./llm/provider";
import { openaiModerate } from "./llm/openai";
import { listFeatured } from "./characters/featured";
import { audit, db, PMap } from "./store";

/**
 * Try-before-signup: visitors can send a few messages to a featured character without an
 * account. Limited per network per day so it can't be farmed; nothing is stored except the count.
 */
export const GUEST_MESSAGES = 3;
const DAY = 86_400_000;
const g = globalThis as unknown as { __guest?: PMap<{ count: number; at: number }> };
const usage: PMap<{ count: number; at: number }> = (g.__guest ??= new PMap(db.sql, "guest_usage"));

export class GuestLimit extends Error {}

export function guestLeft(ip: string | undefined, now = Date.now()) {
  const u = ip ? usage.get(ip) : undefined;
  return u && now - u.at < DAY ? Math.max(0, GUEST_MESSAGES - u.count) : GUEST_MESSAGES;
}

export const publicCharacter = (id: string) => {
  const c = listFeatured().find((x) => x.id === id);
  return c && { id: c.id, name: c.name, age: c.age, gender: c.gender, style: c.style, ethnicity: c.ethnicity, hair: c.hair, eyes: c.eyes, tagline: c.tagline, occupation: c.occupation, personality: c.personality, clipV: undefined };
};

export async function guestReply(ip: string | undefined, characterId: string, text: string, history: ChatTurn[], now = Date.now()) {
  if (!ip) throw new GuestLimit("Sign up to chat.");
  const left = guestLeft(ip, now);
  if (left <= 0) throw new GuestLimit("Free preview used up.");
  const character = listFeatured().find((c) => c.id === characterId);
  if (!character) throw new Error("Character not found");
  const message = text.trim().slice(0, 500);
  if (!message) throw new Error("Empty message");

  const prev = usage.get(ip);
  usage.set(ip, prev && now - prev.at < DAY ? { count: prev.count + 1, at: prev.at } : { count: 1, at: now });

  if (detectSelfHarm(message)) return { message: SELF_HARM_RESPONSE, left: left - 1 };
  const refusal = "I can't go there, but I'm happy to keep talking about something else.";
  if (!moderateText(message, { explicitAllowed: false }).allowed) return { message: refusal, left: left - 1 };
  if (process.env.OPENAI_MODERATION === "true") {
    const cat = await openaiModerate(message, false).catch(() => "unavailable" as const);
    if (cat === "self_harm") return { message: SELF_HARM_RESPONSE, left: left - 1 };
    if (cat) return { message: refusal, left: left - 1 };
  }
  const safeHistory = history
    .filter((t) => (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
    .slice(-6)
    .map((t) => ({ role: t.role, content: t.content.slice(0, 500) }));
  const reply = await getLLM().reply({ character, history: safeHistory, facts: [], userMessage: message, explicit: false, lang: "auto", levelTone: "You just met: be curious, playful and a little mysterious." });
  if (!moderateText(reply, { explicitAllowed: false }).allowed) return { message: refusal, left: left - 1 };
  audit({ userId: "guest", kind: "guest_message", detail: characterId });
  return { message: reply, left: left - 1 };
}
