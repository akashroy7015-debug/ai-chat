import type { LLMProvider } from "./provider";
import { systemPrompt } from "./provider";
import type { ModerationCategory } from "../moderation";

const OPENAI = "https://api.openai.com/v1";

/**
 * Chat can use any OpenAI-compatible server: OpenAI itself, a self-hosted Ollama / vLLM / llama.cpp,
 * or a host like OpenRouter / Together / DeepInfra. Set LLM_BASE_URL (+ LLM_API_KEY, LLM_MODEL).
 */
const chatBase = () => (process.env.LLM_BASE_URL ?? OPENAI).replace(/\/$/, "");
const chatKey = () => process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY ?? (process.env.LLM_BASE_URL ? "none" : undefined);

async function post<T>(base: string, apiKey: string | undefined, path: string, body: unknown, timeoutMs: number): Promise<T> {
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`OpenAI ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

/** Chat Completions. Model is configurable with OPENAI_MODEL. */
export const openaiLLM: LLMProvider = {
  async reply({ character, history, facts, userMessage, explicit, lang }) {
    const r = await post<{ choices: { message: { content: string | null } }[] }>(
      chatBase(), chatKey(), "/chat/completions",
      {
        model: process.env.LLM_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt(character, facts, explicit, lang) },
          ...history,
          { role: "user", content: userMessage },
        ],
        max_tokens: 300,
        temperature: 1.0,
        presence_penalty: 0.4,
      },
      30_000,
    );
    const text = r.choices[0]?.message.content?.trim();
    if (!text) throw new Error("OpenAI returned an empty reply");
    return text;
  },
};

type OpenAIModeration = { results: { flagged: boolean; categories: Record<string, boolean> }[] };

/**
 * OpenAI's free moderation endpoint as a second layer after the rule-based filter.
 * Returns the category to block with, or null if clean.
 */
export async function openaiModerate(text: string, explicitAllowed: boolean): Promise<ModerationCategory | null> {
  // Moderation always uses OpenAI's free endpoint, even when chat runs on another model.
  const r = await post<OpenAIModeration>(OPENAI, process.env.OPENAI_API_KEY, "/moderations", { model: "omni-moderation-latest", input: text }, 10_000);
  const c = r.results[0]?.categories ?? {};
  if (c["sexual/minors"]) return "minor";
  if (c["self-harm/intent"] || c["self-harm/instructions"]) return "self_harm";
  if (c["sexual"] && !explicitAllowed) return "explicit";
  return null;
}
