import { ensureFeatured } from "./characters/featured";
import { db, PMap } from "./store";

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

const g = globalThis as unknown as { __likes?: PMap<{ at: number }> };
const likes: PMap<{ at: number }> = (g.__likes ??= new PMap(db.sql, "likes"));

export function feed(userId?: string, now = Date.now()) {
  ensureFeatured();
  return POSTS.map(([characterId, hoursAgo, text], i) => {
    const c = db.characters.get(characterId);
    if (!c) return null;
    const id = `post-${i + 1}`;
    let count = 0;
    for (const k of likes.keys()) if (k.startsWith(`${id}:`)) count++;
    return {
      id, text, at: now - hoursAgo * 3_600_000,
      character: { id: c.id, name: c.name, age: c.age, hair: c.hair, style: c.style, occupation: c.occupation },
      likes: count,
      liked: userId ? likes.has(`${id}:${userId}`) : false,
    };
  }).filter(Boolean);
}

export function toggleLike(userId: string, postId: string): boolean {
  if (!/^post-\d+$/.test(postId) || Number(postId.slice(5)) > POSTS.length) throw new Error("Unknown post");
  const k = `${postId}:${userId}`;
  if (likes.has(k)) { likes.delete(k); return false; }
  likes.set(k, { at: Date.now() });
  return true;
}
