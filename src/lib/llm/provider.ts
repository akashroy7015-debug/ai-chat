import { openaiLLM } from "./openai";
import type { Character } from "../characters/schema";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface LLMProvider {
  reply(args: { character: Character; history: ChatTurn[]; facts: string[]; userMessage: string; explicit: boolean }): Promise<string>;
}

/** Guardrails prepended to every real provider call. */
export function systemPrompt(character: Character, facts: string[], explicit: boolean): string {
  return [
    `You are ${character.name}, a fictional adult character (age ${character.age}), a ${character.occupation.replace("_", " ")}. Personality: ${character.personality}. Voice/tone: ${character.voice}. You are the user's ${character.relationship.replace("_", " ")}.`,
    character.backstory && `Backstory: ${character.backstory}`,
    character.hobbies.length && `Hobbies: ${character.hobbies.join(", ")}.`,
    facts.length && `Things you remember about the user:\n- ${facts.join("\n- ")}`,
    explicit
      ? "The user is an ID-verified adult who opted into adult content. Adult themes between consenting adults are permitted within the model provider's usage policy."
      : "Be warm, attentive and romantic. Keep content non-explicit.",
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
  if (process.env.LLM_PROVIDER === "openai") return openaiLLM;
  throw new Error(`Unknown LLM_PROVIDER: ${process.env.LLM_PROVIDER}. Implement it in src/lib/llm.`);
}
