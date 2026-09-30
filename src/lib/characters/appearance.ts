import type { Character } from "./schema";

const w = (s: string) => s.replace(/_/g, " ");

/**
 * Attribute-only description handed to the image model. Always states adult age and fictional status,
 * and never includes user free text, so users cannot inject minor-coded or real-person prompts here.
 */
export function describeAppearance(c: Character): string {
  const figure =
    c.gender === "female"
      ? `${w(c.bodyShape)} figure, ${w(c.bust)} bust, ${w(c.hips)} hips`
      : `${w(c.bodyShape)} build`;
  return [
    `fictional adult ${c.gender === "female" ? "woman" : "man"}, clearly ${c.age} years old`,
    c.style === "anime" ? "anime art style, mature adult proportions" : "photorealistic",
    `${w(c.ethnicity)} ethnicity`,
    `${c.hair} ${w(c.hairStyle)} hair, ${c.eyes} eyes`,
    figure,
    `wearing ${w(c.outfit)}`,
    "not resembling any real person",
  ].join(", ");
}

/** Always sent as the negative prompt to image providers. */
export const NEGATIVE_PROMPT =
  "child, minor, teen, young-looking, childlike body, school uniform, celebrity, real person, watermark";
