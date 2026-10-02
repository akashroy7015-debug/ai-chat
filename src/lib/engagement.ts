import { credit } from "./tokens/ledger";
import { db, getUser, saveUser } from "./store";

const DAY = 86_400_000;
const dayIndex = (t: number) => Math.floor((t + 5.5 * 3_600_000) / DAY); // India day boundary

/** Daily reward grows with the streak: 5, 6, 7 … up to 12 tokens on day 8+. Missing a day resets the streak. */
export function dailyStatus(userId: string, now = Date.now()) {
  const u = getUser(userId);
  const today = dayIndex(now);
  const last = u.lastDailyClaim !== undefined ? dayIndex(u.lastDailyClaim) : undefined;
  const claimedToday = last === today;
  const streak = last === undefined ? 0 : today - last <= 1 ? u.dailyStreak ?? 0 : 0;
  const next = claimedToday ? streak : streak + 1;
  return { claimedToday, streak, reward: Math.min(4 + next, 12) };
}

export function claimDaily(userId: string, now = Date.now()) {
  const s = dailyStatus(userId, now);
  if (s.claimedToday) return { ...s, granted: 0 };
  const u = getUser(userId);
  u.dailyStreak = s.streak + 1;
  u.lastDailyClaim = now;
  saveUser(u);
  credit(userId, s.reward, `daily_streak_${u.dailyStreak}`);
  return { claimedToday: true, streak: u.dailyStreak, reward: s.reward, granted: s.reward };
}

/** Relationship level from how much you've talked with her. */
export const LEVELS = [
  { name: "Stranger", at: 0, emoji: "👋" },
  { name: "Crush", at: 10, emoji: "😊" },
  { name: "Date", at: 30, emoji: "🌹" },
  { name: "Girlfriend", at: 75, emoji: "❤️" },
  { name: "Soulmate", at: 150, emoji: "💍" },
] as const;

export function relationship(userId: string, characterId: string) {
  const n = db.messages.filter((m) => m.userId === userId && m.characterId === characterId && m.role === "user").length;
  let i = 0;
  while (i + 1 < LEVELS.length && n >= LEVELS[i + 1].at) i++;
  const next = LEVELS[i + 1];
  return { level: i + 1, ...LEVELS[i], messages: n, nextAt: next?.at ?? null, nextName: next?.name ?? null };
}

/** How the relationship level shapes her tone (always within the non-explicit policy). */
export const LEVEL_TONE = [
  "You just met: be curious, playful and a little mysterious; make him work for your attention.",
  "You have a crush on him: tease more, give compliments, show you've been thinking about him.",
  "You're dating: be openly flirty and affectionate, use pet names sometimes, plan imaginary dates.",
  "You're his girlfriend: be warm, intimate and a bit possessive, miss him, share your day in detail.",
  "You're soulmates: deeply affectionate, know him completely, reference shared memories and inside jokes.",
];

// ---- Surprise photos -------------------------------------------------------
const PHOTO_CAPTIONS = [
  "took this for you 😘", "just for your eyes 🙈", "thinking of you… 📸", "do you like it? 😏",
  "couldn't resist sending you this 💕", "your turn now 😜", "miss me yet? 😉",
];

/**
 * From the "Date" level on, she sometimes sends her picture: always on first reaching Date,
 * otherwise ~12% of replies, never twice within 15 messages.
 */
export function maybeSurprisePhoto(userId: string, characterId: string, prevLevel: number, media: { portrait: boolean; clip: boolean }, rand = Math.random()) {
  const lvl = relationship(userId, characterId).level;
  if (lvl < 3 || (!media.portrait && !media.clip)) return null;
  const thread = db.messages.filter((m) => m.userId === userId && m.characterId === characterId);
  if (thread.slice(-15).some((m) => m.image)) return null;
  if (!(prevLevel < 3 || rand < 0.12)) return null;
  return { content: PHOTO_CAPTIONS[Math.floor(rand * 1000) % PHOTO_CAPTIONS.length], image: (media.clip && rand < 0.5 ? "clip" : media.portrait ? "portrait" : "clip") as "portrait" | "clip" };
}

// ---- Weekly top fans -------------------------------------------------------
/** Anonymous, stable handle (never shows emails). */
export function fanHandle(userId: string) {
  let h = 2166136261;
  for (const ch of userId) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return `Fan_${(h >>> 0).toString(36).slice(0, 5)}`;
}

export function topFans(characterId: string, viewerId?: string, now = Date.now(), limit = 5) {
  const since = now - 7 * DAY;
  const count = new Map<string, number>();
  for (const m of db.messages) if (m.characterId === characterId && m.role === "user" && m.at >= since) count.set(m.userId, (count.get(m.userId) ?? 0) + 1);
  const ranked = [...count.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, limit).map(([u, n], i) => ({ rank: i + 1, handle: fanHandle(u), messages: n, you: u === viewerId }));
  const mine = viewerId ? ranked.findIndex(([u]) => u === viewerId) : -1;
  return { top, yourRank: mine >= 0 ? mine + 1 : null };
}
