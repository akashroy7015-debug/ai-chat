import { afterEach, describe, expect, it, vi } from "vitest";
import { openaiLLM, openaiModerate } from "./openai";
import { handleChat } from "../chat";
import { beginVerification, completeVerification } from "../age/verification";
import { balance, credit } from "../tokens/ledger";
import { CharacterInput } from "../characters/schema";

const character = { ...CharacterInput.parse({ name: "Aria", age: 26, hair: "brown", eyes: "green", build: "slim", style: "photoreal", personality: "calm" }), id: "c", ownerId: "o", createdAt: 0 };

function mockFetch(handler: (url: string, body: any) => unknown, status = 200) {
  const f = vi.fn(async (url: string, init: RequestInit) => new Response(JSON.stringify(handler(url, JSON.parse(String(init.body)))), { status }));
  vi.stubGlobal("fetch", f);
  return f;
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OPENAI_API_KEY;
  delete process.env.LLM_PROVIDER;
  delete process.env.OPENAI_MODERATION;
});

describe("openaiLLM", () => {
  it("sends system prompt with guardrails, history and message; returns text", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const f = mockFetch(() => ({ choices: [{ message: { content: " Hey you! " } }] }));
    const out = await openaiLLM.reply({ character, history: [{ role: "user", content: "earlier" }], facts: ["I love chai"], userMessage: "hi", explicit: false });
    expect(out).toBe("Hey you!");
    const [url, init] = f.mock.calls[0];
    expect(url).toContain("/chat/completions");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer sk-test");
    const body = JSON.parse(String(init.body));
    expect(body.messages[0].role).toBe("system");
    expect(body.messages[0].content).toContain("under 18");
    expect(body.messages[0].content).toContain("I love chai");
    expect(body.messages.at(-1)).toEqual({ role: "user", content: "hi" });
  });

  it("throws without a key", async () => {
    await expect(openaiLLM.reply({ character, history: [], facts: [], userMessage: "hi", explicit: false })).rejects.toThrow("OPENAI_API_KEY");
  });
});

describe("openaiModerate", () => {
  it("maps categories", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    mockFetch(() => ({ results: [{ flagged: true, categories: { "sexual/minors": true } }] }));
    expect(await openaiModerate("x", true)).toBe("minor");
    mockFetch(() => ({ results: [{ flagged: true, categories: { sexual: true } }] }));
    expect(await openaiModerate("x", false)).toBe("explicit");
    expect(await openaiModerate("x", true)).toBeNull();
  });
});

describe("chat with openai", () => {
  async function user(id: string) {
    await beginVerification(id);
    await completeVerification(id);
    credit(id, 10, "test");
  }

  it("refunds the token when OpenAI fails", async () => {
    process.env.LLM_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test";
    mockFetch(() => ({ error: "boom" }), 500);
    await user("oa1");
    const r = await handleChat("oa1", "featured-1", "hello");
    expect(r.kind).toBe("refused");
    expect(balance("oa1")).toBe(10);
  });

  it("blocks when OpenAI moderation flags, and fails closed when it errors", async () => {
    process.env.OPENAI_MODERATION = "true";
    process.env.OPENAI_API_KEY = "sk-test";
    await user("oa2");
    mockFetch(() => ({ results: [{ flagged: true, categories: { "sexual/minors": true } }] }));
    expect((await handleChat("oa2", "featured-1", "hello")).kind).toBe("refused");
    mockFetch(() => ({}), 500);
    expect((await handleChat("oa2", "featured-1", "hello")).kind).toBe("refused");
    expect(balance("oa2")).toBe(10);
  });
});

describe("system prompt language and style", () => {
  it("adds language rule and keeps guardrails", async () => {
    const { systemPrompt } = await import("./provider");
    const p = systemPrompt(character, [], false, "hinglish");
    expect(p).toContain("Hinglish");
    expect(p).toContain("flirty");
    expect(p).toContain("under 18");
    expect(p).toContain("rather than graphic");
    expect(systemPrompt(character, [], false, "hi")).toContain("Devanagari");
  });
});
