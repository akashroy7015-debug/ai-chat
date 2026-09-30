import type { LLMProvider } from "./provider";
import { systemPrompt } from "./provider";
import type { ModerationCategory } from "../moderation";

const API = "https://api.openai.com/v1";

function key(): string {
  const k = process.env.OPENAI_API_KEY;
  if (!k) throw new Error("OPENAI_API_KEY is not set");
  return k;
}

async function post<T>(path: string, body: unknown, timeoutMs: number): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key()}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`OpenAI ${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

/** Chat Completions. Model is configurable with OPENAI_MODEL. */
export const openaiLLM: LLMProvider = {
  async reply({ character, history, facts, userMessage, explicit }) {
    const r = await post<{ choices: { message: { content: string | null } }[] }>(
      "/chat/completions",
      {
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt(character, facts, explicit) },
          ...history,
          { role: "user", content: userMessage },
        ],
        max_tokens: 300,
        temperature: 0.9,
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
  const r = await post<OpenAIModeration>("/moderations", { model: "omni-moderation-latest", input: text }, 10_000);
  const c = r.results[0]?.categories ?? {};
  if (c["sexual/minors"]) return "minor";
  if (c["self-harm/intent"] || c["self-harm/instructions"]) return "self_harm";
  if (c["sexual"] && !explicitAllowed) return "explicit";
  return null;
}
