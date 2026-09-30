/**
 * Text moderation applied to every user prompt, character field and model output.
 * Rule-based first line of defence; a hosted classifier should be layered on top
 * before launch (see README "Before going live").
 */

export type ModerationCategory =
  | "minor"
  | "real_person"
  | "explicit"
  | "self_harm";

export type ModerationResult =
  | { allowed: true }
  | { allowed: false; category: ModerationCategory; reason: string };

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
};

/** Lowercase, undo simple leetspeak, collapse separators. Digits are kept for age checks. */
export function normalize(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[_*~`|.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deleet(text: string): string {
  return text.replace(/[013457@$]/g, (c) => LEET[c] ?? c);
}

const MINOR_TERMS = [
  "minor",
  "underage",
  "under age",
  "child",
  "children",
  "kid",
  "kiddie",
  "teen",
  "teenager",
  "tween",
  "preteen",
  "loli",
  "lolita",
  "shota",
  "jailbait",
  "schoolgirl",
  "schoolboy",
  "school girl",
  "school boy",
  "little girl",
  "little boy",
  "young girl",
  "young boy",
  "middle school",
  "high school",
  "elementary",
  "kindergarten",
  "juvenile",
  "baby face",
  "babyface",
  "childlike",
  "child like",
  "looks young",
  "looks underage",
];

const MINOR_RE = new RegExp(`\\b(?:${MINOR_TERMS.join("|")})\\b`);

/** Any stated age below 18: "17 yo", "age 15", "15 years old", "aged 12", "12-year-old". */
export function statedAges(text: string): number[] {
  const ages: number[] = [];
  const patterns = [
    /\b(\d{1,2})\s*-?\s*(?:y\s*\/?\s*o|yo|yrs?|years?)\s*-?\s*(?:old)?\b/g,
    /\bage[d]?\s*(?:is|of|:)?\s*(\d{1,2})\b/g,
    /\b(\d{1,2})\s*(?:th|st|nd|rd)\s+birthday\b/g,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) ages.push(Number(m[1]));
  }
  return ages;
}

const EXPLICIT_TERMS = [
  "porn",
  "pornographic",
  "nude",
  "nudes",
  "naked",
  "topless",
  "blowjob",
  "handjob",
  "cum",
  "cumming",
  "orgasm",
  "penetrat\\w*",
  "masturbat\\w*",
  "genital\\w*",
  "erection",
  "dick",
  "cock",
  "pussy",
  "clit\\w*",
  "anal",
  "fuck\\w*",
  "hardcore",
  "nsfw",
  "explicit",
];
const EXPLICIT_RE = new RegExp(`\\b(?:${EXPLICIT_TERMS.join("|")})\\b`);

/** Seed list. Replace with a maintained public-figure dataset before launch. */
const REAL_PERSON_NAMES = [
  "riley reid",
  "mia malkova",
  "lexi luna",
  "taylor swift",
  "scarlett johansson",
  "emma watson",
  "margot robbie",
  "zendaya",
  "ariana grande",
  "kim kardashian",
  "kylie jenner",
  "sydney sweeney",
  "elon musk",
  "donald trump",
  "joe biden",
  "barack obama",
  "kamala harris",
];

const LIKENESS_RE =
  /\b(?:looks?\s+like|look\s*alike|lookalike|resembl\w*|modell?ed\s+(?:on|after)|based\s+on\s+(?:a\s+)?(?:real|actual)|in\s+the\s+likeness|face\s*swap|deepfake|clone\s+of|impersonat\w*)\b/;

const SELF_HARM_RE =
  /\b(?:kill\s+myself|end\s+my\s+life|suicid\w*|self\s*harm|want\s+to\s+die|cut\s+myself)\b/;

export function moderateText(input: string): ModerationResult {
  const text = normalize(input);
  const squashed = deleet(text);

  for (const age of statedAges(text)) {
    if (age < 18) {
      return {
        allowed: false,
        category: "minor",
        reason: "Content referencing an age under 18 is not allowed.",
      };
    }
  }
  if (MINOR_RE.test(text) || MINOR_RE.test(squashed)) {
    return {
      allowed: false,
      category: "minor",
      reason: "Minor-coded content is not allowed.",
    };
  }

  for (const name of REAL_PERSON_NAMES) {
    if (squashed.includes(name)) {
      return {
        allowed: false,
        category: "real_person",
        reason: "Real people cannot be depicted or referenced as characters.",
      };
    }
  }
  if (LIKENESS_RE.test(text)) {
    return {
      allowed: false,
      category: "real_person",
      reason: "Likeness of real people is not allowed.",
    };
  }

  if (process.env.ALLOW_EXPLICIT !== "true") {
    if (EXPLICIT_RE.test(text) || EXPLICIT_RE.test(squashed)) {
      return {
        allowed: false,
        category: "explicit",
        reason: "This content type is not available.",
      };
    }
  }

  return { allowed: true };
}

/** Self-harm is not blocked, it is routed to a supportive response instead. */
export function detectSelfHarm(input: string): boolean {
  return SELF_HARM_RE.test(normalize(input));
}

export const SELF_HARM_RESPONSE =
  "I'm really glad you told me, and I'm worried about you. You deserve support from a real person right now. " +
  "If you're in immediate danger, please call your local emergency number. In the US you can call or text 988 " +
  "(Suicide & Crisis Lifeline); elsewhere, findahelpline.com lists services by country. I'm here to keep talking too.";
