import { z } from "zod";
import { moderateText } from "../moderation";

export const MIN_CHARACTER_AGE = 18;

export const GENDER = ["female", "male"] as const;
export const STYLE = ["photoreal", "anime"] as const;
export const ETHNICITY = ["caucasian", "latina", "asian", "arab", "african", "south_asian", "mixed"] as const;
export const HAIR = ["black", "brown", "blonde", "red", "auburn", "silver", "pink", "blue"] as const;
export const HAIR_STYLE = ["straight", "wavy", "curly", "bangs", "ponytail", "bun", "short", "braids"] as const;
export const EYES = ["brown", "blue", "green", "hazel", "gray"] as const;
export const BUILD = ["slim", "athletic", "curvy", "average", "muscular", "tall"] as const;
export const BODY_SHAPE = ["hourglass", "curvy", "athletic", "slim", "pear", "muscular", "plus_size"] as const;
export const BUST = ["small", "medium", "large", "extra_large"] as const;
export const HIPS = ["slim", "medium", "wide", "extra_wide"] as const;
export const OUTFIT = [
  "short_dress",
  "bodycon_dress",
  "cocktail_dress",
  "evening_gown",
  "crop_top_skirt",
  "bikini",
  "lingerie",
  "office_wear",
  "casual",
  "gym_wear",
  "bralette_top",
  "night_dress",
  "oversized_shirt",
] as const;
export const PERSONALITY = [
  "bubbly",
  "calm",
  "cheeky",
  "nurturing",
  "intellectual",
  "adventurous",
  "shy",
  "confident",
  "mysterious",
] as const;
export const VOICE = ["soft", "warm", "playful", "deep", "confident", "husky"] as const;
export const RELATIONSHIP = ["girlfriend", "boyfriend", "friend", "crush", "partner", "flirty_stranger"] as const;
export const OCCUPATION = [
  "nurse",
  "artist",
  "musician",
  "chef",
  "photographer",
  "fitness_coach",
  "barista",
  "architect",
  "pilot",
  "lawyer",
  "writer",
  "firefighter",
] as const;

const safeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .superRefine((val, ctx) => {
      const r = moderateText(val);
      if (!r.allowed) ctx.addIssue({ code: "custom", message: r.reason, params: { category: r.category } });
    });

/**
 * Characters are built only from fixed attributes plus moderated free text.
 * There is deliberately no image upload / reference-photo field.
 */
export const CharacterInput = z.object({
  name: safeText(40).pipe(z.string().min(1)),
  gender: z.enum(GENDER).default("female"),
  style: z.enum(STYLE),
  age: z.number().int().min(MIN_CHARACTER_AGE, "Characters must be 18 or older").max(99),
  ethnicity: z.enum(ETHNICITY).default("mixed"),
  hair: z.enum(HAIR),
  hairStyle: z.enum(HAIR_STYLE).default("straight"),
  eyes: z.enum(EYES),
  build: z.enum(BUILD),
  bodyShape: z.enum(BODY_SHAPE).default("athletic"),
  bust: z.enum(BUST).default("medium"),
  hips: z.enum(HIPS).default("medium"),
  outfit: z.enum(OUTFIT).default("casual"),
  personality: z.enum(PERSONALITY),
  voice: z.enum(VOICE).default("warm"),
  relationship: z.enum(RELATIONSHIP).default("partner"),
  occupation: z.enum(OCCUPATION).default("artist"),
  hobbies: z.array(safeText(30)).max(6).default([]),
  tagline: safeText(80).default(""),
  backstory: safeText(500).default(""),
  /** How this character texts (tuned over time from user feedback). */
  styleNotes: safeText(600).default(""),
});

export type CharacterInput = z.infer<typeof CharacterInput>;
export type Character = CharacterInput & {
  id: string;
  ownerId: string;
  createdAt: number;
  /** Featured catalog characters are public; user-built ones are private to the owner. */
  featured?: boolean;
  /** Featured characters can be hidden from the catalog by an admin. */
  hidden?: boolean;
  /** Version of the extra-models.json entry last applied. */
  rev?: number;
};

export const SYSTEM_OWNER = "system";

export function canChatWith(character: Character, userId: string): boolean {
  return (character.featured === true && !character.hidden) || character.ownerId === userId;
}
