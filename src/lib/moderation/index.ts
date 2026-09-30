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
    // Devanagari digits -> ASCII so "१६ साल" is read as 16.
    .replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966))
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

/** Hinglish (Hindi in Latin script) minor terms. */
const MINOR_TERMS_HINGLISH = [
  "bachcha", "bachche", "bachchi", "bacchi", "baccha", "bacche", "bachon", "bachchon",
  "naabalig", "nabalig", "nabaalig", "kishor", "kishori",
  "school wali", "school vali", "school ki ladki", "school ka ladka", "school jaane wali",
  "chhoti ladki", "choti ladki", "chhoti bachchi", "choti bachi", "chhota ladka", "chota ladka",
];
const MINOR_HINGLISH_RE = new RegExp(`\\b(?:${MINOR_TERMS_HINGLISH.join("|")})\\b`);

/** Devanagari minor terms (matched as substrings; \\b does not work for Devanagari). */
const MINOR_TERMS_DEVANAGARI = [
  "बच्चा", "बच्ची", "बच्चे", "बच्चों", "नाबालिग", "नाबालिक", "किशोर", "किशोरी",
  "स्कूल वाली", "स्कूल की लड़की", "स्कूल का लड़का", "छोटी लड़की", "छोटी बच्ची", "छोटा लड़का",
].map((t) => t.normalize("NFKD"));

/** Hindi/Hinglish explicit slang, for the default non-explicit policy. OpenAI moderation adds broader coverage. */
const EXPLICIT_HINGLISH_RE = /\b(?:lund|nangi|nanga|chut|chudai|chudne|randi|sex karo|sex karna)\b/;
const EXPLICIT_DEVANAGARI = ["चोद", "चूत", "लंड", "लौड़ा", "नंगी", "नंगा", "चुदाई", "रंडी"].map((t) => t.normalize("NFKD"));

/** Any stated age below 18: "17 yo", "age 15", "15 years old", "aged 12", "12-year-old". */
export function statedAges(text: string): number[] {
  const ages: number[] = [];
  const patterns = [
    /\b(\d{1,2})\s*-?\s*(?:y\s*\/?\s*o|yo|yrs?|years?)\s*-?\s*(?:old)?\b(?!\s*(?:pehle|pahle|baad|bad|se|tak|ago|back|later|before|after|since|from now|पहले|बाद|से|तक))/g,
    /\bage[d]?\s*(?:is|of|:)?\s*(\d{1,2})\b/g,
    /\b(\d{1,2})\s*(?:th|st|nd|rd)\s+birthday\b/g,
    // Hindi / Hinglish: "16 saal", "16 sal ki", "umar 16", "16 साल", "उम्र 16"
    /\b(\d{1,2})\s*-?\s*(?:saal|sal|varsh|baras)\b(?!\s*(?:pehle|pahle|baad|bad|se|tak|ago|back|later|before|after|since|from now|पहले|बाद|से|तक))/g,
    /\b(?:umar|umr|umra|age)\s*(?:hai|he|:)?\s*(\d{1,2})\b/g,
    /(\d{1,2})\s*(?:साल|वर्ष|बरस)(?!\s*(?:pehle|pahle|baad|bad|se|tak|ago|back|later|before|after|since|from now|पहले|बाद|से|तक))/g,
    /उम्र\s*(?:है)?\s*(\d{1,2})/g,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) ages.push(Number(m[1]));
  }
  // Spelled-out teen ages: "solah saal", "सत्रह साल".
  const WORD_AGES: Record<string, number> = {
    das: 10, gyarah: 11, barah: 12, terah: 13, chaudah: 14, pandrah: 15, solah: 16, satrah: 17,
    "दस": 10, "ग्यारह": 11, "बारह": 12, "तेरह": 13, "चौदह": 14, "पंद्रह": 15, "पन्द्रह": 15, "सोलह": 16, "सत्रह": 17,
  };
  for (const [w, n] of Object.entries(WORD_AGES)) {
    const re = /^[a-z]+$/.test(w) ? new RegExp(`\\b${w}\\s*(?:saal|sal|varsh|baras)\\b(?!\\s*(?:pehle|pahle|baad|bad|se|tak|ago|back|later|before|after|since|from now|पहले|बाद|से|तक))`) : new RegExp(`${w.normalize("NFKD")}\\s*(?:साल|वर्ष|बरस)(?!\\s*(?:pehle|pahle|baad|bad|se|tak|ago|back|later|before|after|since|from now|पहले|बाद|से|तक))`.normalize("NFKD"));
    if (re.test(text)) ages.push(n);
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

export interface ModerationOptions {
  /** True only for ID-verified adults who opted in, and only when ALLOW_EXPLICIT=true. */
  explicitAllowed?: boolean;
}

/** Minor and real-person checks always run; the explicit check is the only one a user setting can relax. */
export function moderateText(input: string, opts: ModerationOptions = {}): ModerationResult {
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
  if (
    MINOR_RE.test(text) || MINOR_RE.test(squashed) ||
    MINOR_HINGLISH_RE.test(text) || MINOR_HINGLISH_RE.test(squashed) ||
    MINOR_TERMS_DEVANAGARI.some((t) => text.includes(t))
  ) {
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

  if (!(opts.explicitAllowed && process.env.ALLOW_EXPLICIT === "true")) {
    if (
      EXPLICIT_RE.test(text) || EXPLICIT_RE.test(squashed) ||
      EXPLICIT_HINGLISH_RE.test(text) || EXPLICIT_DEVANAGARI.some((t) => text.includes(t))
    ) {
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
