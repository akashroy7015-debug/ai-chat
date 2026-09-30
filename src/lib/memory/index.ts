import { db } from "../store";

const MAX_FACTS = 50;
const key = (userId: string, characterId: string) => `${userId}:${characterId}`;

/** Extremely simple fact extractor for the MVP: "I am/I'm/my X ..." statements. Replace with LLM extraction + pgvector. */
export function extractFacts(message: string): string[] {
  const out: string[] = [];
  for (const m of message.matchAll(/\b(?:i am|i'm|i love|i like|my [a-z]+ is|my name is)\b[^.!?\n]{2,80}/gi)) {
    out.push(m[0].trim());
  }
  return out;
}

export function remember(userId: string, characterId: string, message: string) {
  const facts = extractFacts(message);
  if (!facts.length) return;
  const k = key(userId, characterId);
  const list = db.facts.get(k)?.list ?? [];
  for (const f of facts) if (!list.includes(f)) list.push(f);
  db.facts.set(k, { list: list.slice(-MAX_FACTS) });
}

export function recall(userId: string, characterId: string): string[] {
  return db.facts.get(key(userId, characterId))?.list ?? [];
}
