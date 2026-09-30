import { ensureFeatured } from "./characters/featured";
import { db, newId, PMap } from "./store";
import { moderateText } from "./moderation";

/** Short SFW status posts from featured characters, spaced out so the feed feels alive. */
const POSTS: Array<[characterId: string, hoursAgo: number, text: string]> = [
  ["featured-1", 2, "Caught the most unreal sunset on the cliffs tonight 🌅 wish you'd seen it."],
  ["featured-2", 3, "New tapas special tonight. First person to guess the secret ingredient gets a free plate 😉"],
  ["featured-8", 4, "Closed a huge case today. Celebrating with a glass of red. Who's joining me? 🍷"],
  ["featured-3", 5, "Sketched a stranger on the train again. He noticed. I died a little 🙈"],
  ["featured-5", 7, "5am run done ✅ your turn. No excuses 💪"],
  ["featured-9", 8, "Made way too much paella again. You know what that means… come hungry."],
  ["featured-4", 10, "Hot take: the best buildings are libraries. Fight me 📚"],
  ["featured-11", 12, "Neon lights, rain, one more high score. Perfect night 🎮"],
  ["featured-6", 14, "Long shift. Tea, plants, quiet. Tell me something good about your day 🌿"],
  ["featured-7", 20, "Paris café, chapter 12, and a plot twist I didn't see coming ✍️"],
  ["featured-10", 22, "Yoga at sunrise, jazz bar at midnight. Balance 🖤"],
  ["featured-13", 26, "Night flight over the city. It's so quiet up here ✈️"],
  ["featured-15", 30, "Pancakes are on me this Sunday 🥞"],
  ["featured-16", 34, "Played piano till 2am. Neighbours are either fans or furious 🎹"],
];

const g = globalThis as unknown as { __likes?: PMap<{ at: number }>; __posts?: PMap<CustomPost> };
const likes: PMap<{ at: number }> = (g.__likes ??= new PMap(db.sql, "likes"));

interface CustomPost { id: string; characterId: string; text: string; at: number }
/** Posts written by admins, stored in the database. */
const customPosts: PMap<CustomPost> = (g.__posts ??= new PMap(db.sql, "posts"));

export function addPost(characterId: string, text: string): CustomPost {
  const c = db.characters.get(characterId);
  if (!c?.featured) throw new Error("Unknown character");
  const verdict = moderateText(text);
  if (!verdict.allowed) throw new Error(verdict.reason);
  const t = text.trim().slice(0, 500);
  if (!t) throw new Error("Empty post");
  const p = { id: `cpost-${newId().slice(0, 8)}`, characterId, text: t, at: Date.now() };
  customPosts.set(p.id, p);
  return p;
}

export function deletePost(id: string) {
  if (customPosts.has(id)) customPosts.delete(id);
}

export function feed(userId?: string, now = Date.now()) {
  ensureFeatured();
  const all: Array<{ id: string; characterId: string; text: string; at: number }> = [
    ...POSTS.map(([characterId, hoursAgo, text], i) => ({ id: `post-${i + 1}`, characterId, text, at: now - hoursAgo * 3_600_000 })),
    ...customPosts.values(),
  ].sort((a, b) => b.at - a.at);
  return all.map(({ id, characterId, text, at }) => {
    const c = db.characters.get(characterId);
    if (!c || c.hidden) return null;
    let count = 0;
    for (const k of likes.keys()) if (k.startsWith(`${id}:`)) count++;
    return {
      id, text, at,
      character: { id: c.id, name: c.name, age: c.age, hair: c.hair, style: c.style, occupation: c.occupation },
      likes: count,
      liked: userId ? likes.has(`${id}:${userId}`) : false,
    };
  }).filter(Boolean);
}

export function toggleLike(userId: string, postId: string): boolean {
  const builtIn = /^post-\d+$/.test(postId) && Number(postId.slice(5)) <= POSTS.length;
  if (!builtIn && !customPosts.has(postId)) throw new Error("Unknown post");
  const k = `${postId}:${userId}`;
  if (likes.has(k)) { likes.delete(k); return false; }
  likes.set(k, { at: Date.now() });
  return true;
}
