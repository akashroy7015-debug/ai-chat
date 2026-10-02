/** Mirrors the enums in lib/characters/schema.ts (kept client-side so pages stay small). */
export const OPTIONS = {
  gender: ["female", "male"],
  style: ["photoreal", "anime"],
  ethnicity: ["caucasian", "latina", "asian", "arab", "african", "south_asian", "mixed"],
  hair: ["black", "brown", "blonde", "red", "auburn", "silver", "pink", "blue"],
  hairStyle: ["straight", "wavy", "curly", "bangs", "ponytail", "bun", "short", "braids"],
  eyes: ["brown", "blue", "green", "hazel", "gray"],
  build: ["slim", "athletic", "curvy", "average", "muscular", "tall"],
  bodyShape: ["hourglass", "curvy", "athletic", "slim", "pear", "muscular", "plus_size"],
  bust: ["small", "medium", "large", "extra_large"],
  hips: ["slim", "medium", "wide", "extra_wide"],
  outfit: ["short_dress", "bodycon_dress", "cocktail_dress", "evening_gown", "crop_top_skirt", "bikini", "lingerie", "office_wear", "casual", "gym_wear", "bralette_top", "night_dress", "oversized_shirt"],
  personality: ["bubbly", "calm", "cheeky", "nurturing", "intellectual", "adventurous", "shy", "confident", "mysterious"],
  voice: ["soft", "warm", "playful", "deep", "confident", "husky"],
  relationship: ["girlfriend", "boyfriend", "friend", "crush", "partner", "flirty_stranger"],
  occupation: ["nurse", "artist", "musician", "chef", "photographer", "fitness_coach", "barista", "architect", "pilot", "lawyer", "writer", "firefighter"],
} as const;
export type OptionKey = keyof typeof OPTIONS;
