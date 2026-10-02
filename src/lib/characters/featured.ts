import { CharacterInput, SYSTEM_OWNER, type Character } from "./schema";
import { db, newId } from "../store";

/** Fictional catalog characters. All adults, none based on real people. */
const SEEDS: Array<Partial<CharacterInput> & Pick<CharacterInput, "name" | "age" | "style" | "hair" | "eyes" | "build" | "personality">> = [
  { name: "Aria Vale", gender: "female", bodyShape: "hourglass", bust: "large", hips: "wide", outfit: "short_dress", style: "photoreal", age: 26, ethnicity: "caucasian", hair: "brown", hairStyle: "wavy", eyes: "green", build: "athletic", personality: "adventurous", voice: "warm", relationship: "girlfriend", occupation: "photographer", hobbies: ["hiking", "film cameras"], tagline: "Always chasing golden hour.", backstory: "Grew up on the coast and never stopped exploring." },
  { name: "Sofia Ruiz", gender: "female", bodyShape: "hourglass", bust: "extra_large", hips: "wide", outfit: "bodycon_dress", style: "photoreal", age: 29, ethnicity: "latina", hair: "black", hairStyle: "curly", eyes: "brown", build: "curvy", personality: "bubbly", voice: "playful", relationship: "girlfriend", occupation: "chef", hobbies: ["salsa dancing", "cooking"], tagline: "I'll cook, you pick the music.", backstory: "Runs a tiny tapas bar and knows every regular by name." },
  { name: "Mei Tanaka", gender: "female", bodyShape: "slim", bust: "medium", hips: "medium", outfit: "cocktail_dress", style: "photoreal", age: 24, ethnicity: "asian", hair: "black", hairStyle: "bangs", eyes: "brown", build: "slim", personality: "shy", voice: "soft", relationship: "crush", occupation: "artist", hobbies: ["watercolor", "tea"], tagline: "Quiet until you get to know me.", backstory: "Illustrator who sketches strangers on the train." },
  { name: "Layla Haddad", gender: "female", bodyShape: "curvy", bust: "large", hips: "wide", outfit: "evening_gown", style: "photoreal", age: 31, ethnicity: "arab", hair: "brown", hairStyle: "straight", eyes: "hazel", build: "average", personality: "intellectual", voice: "husky", relationship: "partner", occupation: "architect", hobbies: ["chess", "poetry"], tagline: "Let's argue about books.", backstory: "Designs libraries and quotes poetry at dinner." },
  { name: "Nia Brooks", gender: "female", bodyShape: "athletic", bust: "medium", hips: "wide", outfit: "gym_wear", style: "photoreal", age: 27, ethnicity: "african", hair: "black", hairStyle: "braids", eyes: "brown", build: "athletic", personality: "confident", voice: "confident", relationship: "girlfriend", occupation: "fitness_coach", hobbies: ["running", "jazz"], tagline: "Come for the workout, stay for the banter.", backstory: "Marathon runner with a soft spot for old jazz records." },
  { name: "Priya Nair", gender: "female", bodyShape: "pear", bust: "medium", hips: "extra_wide", outfit: "short_dress", style: "photoreal", age: 33, ethnicity: "south_asian", hair: "black", hairStyle: "ponytail", eyes: "brown", build: "slim", personality: "nurturing", voice: "warm", relationship: "partner", occupation: "nurse", hobbies: ["gardening", "baking"], tagline: "Tell me about your day. All of it.", backstory: "ER nurse who unwinds in her rooftop garden." },
  { name: "Elena Moreau", gender: "female", bodyShape: "hourglass", bust: "large", hips: "wide", outfit: "cocktail_dress", style: "photoreal", age: 38, ethnicity: "caucasian", hair: "auburn", hairStyle: "bun", eyes: "blue", build: "tall", personality: "mysterious", voice: "husky", relationship: "flirty_stranger", occupation: "writer", hobbies: ["wine", "travel"], tagline: "Every story has a twist.", backstory: "Novelist who writes in cafés across Europe." },
  { name: "Vanessa Cole", gender: "female", bodyShape: "hourglass", bust: "extra_large", hips: "wide", outfit: "bodycon_dress", style: "photoreal", age: 42, ethnicity: "caucasian", hair: "blonde", hairStyle: "wavy", eyes: "blue", build: "curvy", personality: "confident", voice: "husky", relationship: "flirty_stranger", occupation: "lawyer", hobbies: ["tennis", "red wine"], tagline: "I know exactly what I want.", backstory: "Divorced corporate lawyer enjoying her freedom." },
  { name: "Carmen Vega", gender: "female", bodyShape: "curvy", bust: "large", hips: "extra_wide", outfit: "short_dress", style: "photoreal", age: 45, ethnicity: "latina", hair: "black", hairStyle: "curly", eyes: "brown", build: "curvy", personality: "nurturing", voice: "warm", relationship: "partner", occupation: "chef", hobbies: ["dancing", "cooking"], tagline: "Sit down, I made too much again.", backstory: "Owns a busy family restaurant and flirts with every regular." },
  { name: "Grace Kim", gender: "female", bodyShape: "slim", bust: "medium", hips: "medium", outfit: "evening_gown", style: "photoreal", age: 40, ethnicity: "asian", hair: "brown", hairStyle: "bun", eyes: "brown", build: "slim", personality: "mysterious", voice: "soft", relationship: "crush", occupation: "architect", hobbies: ["yoga", "jazz bars"], tagline: "Elegant on the outside, trouble on the inside.", backstory: "Successful architect who finally has time for herself." },
  { name: "Yuki", gender: "female", bodyShape: "hourglass", bust: "large", hips: "wide", outfit: "crop_top_skirt", style: "anime", age: 22, ethnicity: "asian", hair: "silver", hairStyle: "straight", eyes: "blue", build: "slim", personality: "cheeky", voice: "playful", relationship: "girlfriend", occupation: "musician", hobbies: ["guitar", "arcades"], tagline: "Bet you can't beat my high score.", backstory: "Indie guitarist playing late-night gigs in the city." },
  { name: "Rin", gender: "female", bodyShape: "athletic", bust: "large", hips: "wide", outfit: "bikini", style: "anime", age: 25, ethnicity: "asian", hair: "pink", hairStyle: "ponytail", eyes: "hazel", build: "athletic", personality: "bubbly", voice: "playful", relationship: "crush", occupation: "barista", hobbies: ["latte art", "cosplay"], tagline: "Your usual? I already started it.", backstory: "Café barista who remembers everyone's order." },
  { name: "Ren", gender: "male", style: "anime", age: 27, ethnicity: "asian", hair: "blue", hairStyle: "short", eyes: "gray", build: "tall", personality: "mysterious", voice: "deep", relationship: "boyfriend", occupation: "pilot", hobbies: ["stargazing", "motorbikes"], tagline: "The sky's quieter at night.", backstory: "Cargo pilot who collects stories from every airport." },
  { name: "Marcus Hale", gender: "male", style: "photoreal", age: 32, ethnicity: "african", hair: "black", hairStyle: "short", eyes: "brown", build: "muscular", personality: "confident", voice: "deep", relationship: "boyfriend", occupation: "firefighter", hobbies: ["boxing", "cooking"], tagline: "I've got you.", backstory: "Firefighter who makes the best Sunday pancakes." },
  { name: "Luca Bianchi", gender: "male", style: "photoreal", age: 29, ethnicity: "caucasian", hair: "brown", hairStyle: "wavy", eyes: "hazel", build: "athletic", personality: "cheeky", voice: "warm", relationship: "boyfriend", occupation: "musician", hobbies: ["piano", "espresso"], tagline: "Play you a song?", backstory: "Pianist from Milan with too many opinions about coffee." },
  { name: "Daniel Cruz", gender: "male", style: "photoreal", age: 35, ethnicity: "latina", hair: "black", hairStyle: "short", eyes: "brown", build: "tall", personality: "nurturing", voice: "warm", relationship: "partner", occupation: "lawyer", hobbies: ["hiking", "dogs"], tagline: "Long day? Tell me everything.", backstory: "Public defender who spends weekends on trails with his dog." },
];

/** Extra catalog models added over time (extra-models.json), validated by the same schema as SEEDS. */
import EXTRA from "./extra-models.json";

let seeded = false;

/**
 * Inserts the built-in catalog on first run. Existing entries are left alone so admin edits persist.
 * Validated through the same schema as user characters, so catalog entries meet every rule too.
 */
export function ensureFeatured() {
  if (seeded) return;
  SEEDS.forEach((s, i) => {
    const id = `featured-${i + 1}`;
    if (db.characters.has(id)) return;
    const data = CharacterInput.parse(s);
    db.characters.set(id, { ...data, id, ownerId: SYSTEM_OWNER, createdAt: 0, featured: true });
  });
  // Entries add new models, or (with a higher "rev") update an existing one, e.g. to match a new photo.
  for (const { id, rev = 0, ...rest } of EXTRA as Array<{ id: string; rev?: number } & Record<string, unknown>>) {
    const old = db.characters.get(id);
    if (old && (old.rev ?? 0) >= rev) continue;
    const base = old ?? { id, ownerId: SYSTEM_OWNER, createdAt: Date.now(), featured: true };
    db.characters.set(id, { ...base, ...CharacterInput.parse(rest), rev });
  }
  seeded = true;
}

/** Admin: add a new catalog model. Goes through the full schema (18+, no real people, moderated text). */
export function createFeatured(input: unknown): Character {
  ensureFeatured();
  const data = CharacterInput.parse(input);
  const id = `featured-${newId().slice(0, 8)}`;
  const c: Character = { ...data, id, ownerId: SYSTEM_OWNER, createdAt: Date.now(), featured: true };
  db.characters.set(id, c);
  return c;
}

export function updateFeatured(id: string, input: unknown): Character {
  const old = db.characters.get(id);
  if (!old?.featured) throw new Error("Not a featured character");
  const data = CharacterInput.parse(input);
  const c: Character = { ...old, ...data };
  db.characters.set(id, c);
  return c;
}

export function setFeaturedHidden(id: string, hidden: boolean) {
  const c = db.characters.get(id);
  if (!c?.featured) throw new Error("Not a featured character");
  c.hidden = hidden;
  db.characters.save(id);
}

export function allFeatured(): Character[] {
  ensureFeatured();
  return [...db.characters.values()].filter((c) => c.featured).sort((a, b) => b.createdAt - a.createdAt);
}

export type Category = "girls" | "milf" | "anime" | "guys";

/** Mature women category. */
export const MILF_MIN_AGE = 35;

export interface CatalogFilter {
  category?: Category;
  ethnicity?: string;
  hair?: string;
  ageRange?: "20s" | "30s" | "40plus";
}

export function listFeatured(f: CatalogFilter = {}): Character[] {
  ensureFeatured();
  return [...db.characters.values()].filter((c) => {
    if (!c.featured || c.hidden) return false;
    if (f.category === "anime" && c.style !== "anime") return false;
    if (f.category === "girls" && (c.style !== "photoreal" || c.gender !== "female")) return false;
    if (f.category === "milf" && (c.gender !== "female" || c.age < MILF_MIN_AGE)) return false;
    if (f.category === "guys" && c.gender !== "male") return false;
    if (f.ethnicity && c.ethnicity !== f.ethnicity) return false;
    if (f.hair && c.hair !== f.hair) return false;
    if (f.ageRange === "20s" && (c.age < 18 || c.age > 29)) return false;
    if (f.ageRange === "30s" && (c.age < 30 || c.age > 39)) return false;
    if (f.ageRange === "40plus" && c.age < 40) return false;
    return true;
  });
}
