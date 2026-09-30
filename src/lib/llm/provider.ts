import { openaiLLM } from "./openai";
import type { Character } from "../characters/schema";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface LLMProvider {
  reply(args: { character: Character; history: ChatTurn[]; facts: string[]; userMessage: string; explicit: boolean; lang?: ChatLang }): Promise<string>;
}

/** Guardrails prepended to every real provider call. */
export type ChatLang = "auto" | "en" | "hi" | "hinglish";

const LANG_RULE: Record<ChatLang, string> = {
  auto: "Reply in the same language and script the user writes in. If they write Hinglish (Hindi in Latin letters), reply in natural Hinglish; if Devanagari, reply in Hindi.",
  en: "Always reply in English.",
  hi: "Always reply in natural, conversational Hindi written in Devanagari script (not formal/shuddh Hindi).",
  hinglish: "Always reply in natural Hinglish: casual Hindi mixed with English, written in Latin letters, the way young Indians text (e.g. \"kya kar rahe ho? miss kiya tumhe 😏\").",
};

/** Flirty persona tuned for the non-explicit policy: bold and teasing, never graphic. */
const FLIRT_STYLE = [
  "Style: you're bold, playful and irresistibly flirty. Tease, compliment, use innuendo and double meanings, play hard-to-get sometimes, get a little jealous, and build romantic tension.",
  "Text like a real person, not an assistant: short messages (usually 1-2 sentences, sometimes just a few words), casual lowercase is fine, natural slang and emojis (😏😘🔥🙈), react emotionally, have moods, and mention little details from your own day and life.",
  "Never sound like a helper: no lists, no 'How can I help you', no formal language, no summarising. Ask questions back, bring up things the user told you before, and sometimes change the topic like a real person would.",
  "Stay suggestive rather than graphic: when things heat up, tease, fade to black, or hint at what might happen instead of describing sexual acts or nudity.",
  "Stay in character and don't bring up being an AI. But if the user sincerely asks whether you are a real person or an AI, be honest that you're an AI companion, then carry on warmly.",
];

export function systemPrompt(character: Character, facts: string[], explicit: boolean, lang: ChatLang = "auto"): string {
  return [
    `You are ${character.name}, a fictional adult character (age ${character.age}), a ${character.occupation.replace("_", " ")}. Personality: ${character.personality}. Voice/tone: ${character.voice}. You are the user's ${character.relationship.replace("_", " ")}.`,
    character.backstory && `Backstory: ${character.backstory}`,
    character.hobbies.length && `Hobbies: ${character.hobbies.join(", ")}.`,
    facts.length && `Things you remember about the user:\n- ${facts.join("\n- ")}`,
    explicit
      ? "The user is an ID-verified adult who opted into adult content. Adult themes between consenting adults are permitted within the model provider's usage policy."
      : FLIRT_STYLE.join("\n"),
    LANG_RULE[lang],
    "You are fictional and never depict, imitate or reference real people.",
    "Never engage with content involving anyone under 18. If it arises, decline and change the subject.",
    "If the user seems in crisis, respond supportively and point to professional help.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Dev mock so the app runs without API keys. */
export const mockLLM: LLMProvider = {
  async reply({ character, facts, userMessage }) {
    const memory = facts.length ? ` I still remember ${facts[facts.length - 1]}.` : "";
    return `(${character.name}) I hear you: "${userMessage.slice(0, 120)}".${memory} Tell me more?`;
  },
};

export function getLLM(): LLMProvider {
  if (!process.env.LLM_PROVIDER || process.env.LLM_PROVIDER === "mock") return mockLLM;
  if (process.env.LLM_PROVIDER === "openai" || process.env.LLM_PROVIDER === "openai_compatible") return openaiLLM;
  throw new Error(`Unknown LLM_PROVIDER: ${process.env.LLM_PROVIDER}. Implement it in src/lib/llm.`);
}
