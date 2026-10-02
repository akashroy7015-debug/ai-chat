import type { Character } from "./characters/schema";
import { canChatWith } from "./characters/schema";
import { ensureFeatured } from "./characters/featured";
import { requireVerifiedAdult, AccessDenied } from "./age/verification";
import { db, newId, type Message } from "./store";

/** A character reaches out if the user has been away this long. */
export const PROACTIVE_AFTER_MS = 12 * 60 * 60 * 1000;

const pick = <T,>(xs: readonly T[], seed: number) => xs[Math.abs(seed) % xs.length];

function seedOf(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return h;
}

/** Templated, free (no LLM call) openers written from the character's own attributes. */
export function firstGreeting(c: Character, seed = seedOf(c.id)): string {
  const hobby = c.hobbies[0];
  const lines = [
    `Hey, I'm ${c.name.split(" ")[0]}. ${c.tagline || "So glad you stopped by."}`,
    `Well hello there 👋 I'm ${c.name.split(" ")[0]}. ${hobby ? `I was just thinking about ${hobby}. ` : ""}What's your name?`,
    `Hi! ${c.tagline || "I've been hoping someone interesting would say hi."} Tell me something about you.`,
  ];
  return pick(lines, seed);
}

export function missYouMessage(c: Character, seed: number): string {
  const hobby = c.hobbies[seed % Math.max(c.hobbies.length, 1)];
  const lines = [
    "thought of you today. no reason 🙂",
    "hey you. how did your day go?",
    hobby ? `just finished ${hobby} and wanted to tell you about it. where have you been?` : "it's been quiet without you. what are you up to?",
    "I was hoping you'd come back. tell me everything.",
  ];
  return pick(lines, seed);
}

function thread(userId: string, characterId: string): Message[] {
  return db.messages.filter((m) => m.userId === userId && m.characterId === characterId);
}

/** Returns the thread, first adding a proactive message from the character when appropriate. */
export function openConversation(userId: string, characterId: string, now = Date.now()) {
  requireVerifiedAdult(userId);
  ensureFeatured();
  const character = db.characters.get(characterId);
  if (!character || !canChatWith(character, userId)) throw new AccessDenied("banned", "Character not found.", 404);

  const msgs = thread(userId, characterId);
  const last = msgs[msgs.length - 1];
  let text: string | undefined;
  if (!last) text = firstGreeting(character);
  else if (now - last.at > PROACTIVE_AFTER_MS && last.role === "user") text = missYouMessage(character, seedOf(last.id));
  else if (now - last.at > PROACTIVE_AFTER_MS * 2) text = missYouMessage(character, seedOf(last.id));
  if (text) db.messages.push({ id: newId(), userId, characterId, role: "assistant", content: text, at: now });

  return thread(userId, characterId).slice(-100).map(({ id, role, content, image, at }) => ({ id, role, content, image, at }));
}

/** Latest message per character, newest first: the "Chats" list. */
export function listConversations(userId: string) {
  ensureFeatured();
  const latest = new Map<string, Message>();
  for (const m of db.messages) if (m.userId === userId) latest.set(m.characterId, m);
  return [...latest.values()]
    .sort((a, b) => b.at - a.at)
    .map((m) => {
      const c = db.characters.get(m.characterId);
      return c && { character: { id: c.id, name: c.name, age: c.age, hair: c.hair, style: c.style }, last: { role: m.role, content: m.content, at: m.at } };
    })
    .filter(Boolean);
}
