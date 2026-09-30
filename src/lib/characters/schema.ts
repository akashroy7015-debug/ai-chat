import { z } from "zod";
import { moderateText } from "../moderation";

export const MIN_CHARACTER_AGE = 18;

export const HAIR = ["black", "brown", "blonde", "red", "auburn", "silver", "pink", "blue"] as const;
export const EYES = ["brown", "blue", "green", "hazel", "gray"] as const;
export const BUILD = ["slim", "athletic", "curvy", "average", "tall", "petite"] as const;
export const STYLE = ["photoreal", "anime"] as const;
export const PERSONALITY = [
  "bubbly",
  "calm",
  "cheeky",
  "nurturing",
  "intellectual",
  "adventurous",
  "shy",
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
  age: z.number().int().min(MIN_CHARACTER_AGE, "Characters must be 18 or older").max(99),
  hair: z.enum(HAIR),
  eyes: z.enum(EYES),
  build: z.enum(BUILD),
  style: z.enum(STYLE),
  personality: z.enum(PERSONALITY),
  hobbies: z.array(safeText(30)).max(6).default([]),
  backstory: safeText(500).default(""),
});

export type CharacterInput = z.infer<typeof CharacterInput>;
export type Character = CharacterInput & { id: string; ownerId: string; createdAt: number };
