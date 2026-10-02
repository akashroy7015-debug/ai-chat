import { AccessDenied } from "./age/verification";
import { db, PMap } from "./store";

interface Vote { userId: string; characterId: string; messageId: string; vote: 1 | -1; at: number }
const g = globalThis as unknown as { __votes?: PMap<Vote> };
const votes: PMap<Vote> = (g.__votes ??= new PMap(db.sql, "feedback"));

/** 👍/👎 on one of the character's replies in your own chat. Voting the same way again clears it. */
export function vote(userId: string, messageId: string, v: 1 | -1): 1 | -1 | 0 {
  const m = db.messages.find((x) => x.id === messageId);
  if (!m || m.userId !== userId || m.role !== "assistant") throw new AccessDenied("banned", "Message not found.", 404);
  const k = `${userId}:${messageId}`;
  if (votes.get(k)?.vote === v) { votes.delete(k); return 0; }
  votes.set(k, { userId, characterId: m.characterId, messageId, vote: v, at: Date.now() });
  return v;
}

/** Aggregate feedback per character plus recent disliked replies (character text only, no user data). */
export function feedbackSummary(since = 0) {
  const per = new Map<string, { up: number; down: number }>();
  const disliked: { characterId: string; reply: string; at: number }[] = [];
  for (const x of votes.values()) {
    if (x.at < since) continue;
    const p = per.get(x.characterId) ?? { up: 0, down: 0 };
    if (x.vote === 1) p.up++; else p.down++;
    per.set(x.characterId, p);
    if (x.vote === -1) {
      const m = db.messages.find((y) => y.id === x.messageId);
      if (m) disliked.push({ characterId: x.characterId, reply: m.content.slice(0, 240), at: x.at });
    }
  }
  return {
    perCharacter: [...per.entries()].map(([id, p]) => ({ id, name: db.characters.get(id)?.name ?? id, ...p })),
    recentDisliked: disliked.sort((a, b) => b.at - a.at).slice(0, 25),
  };
}
