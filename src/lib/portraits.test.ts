import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { featuredJobStatus, portraitPrompt, readPortrait, startFeaturedPortraits, userPortrait } from "./portraits";
import { CharacterInput } from "./characters/schema";
import { beginVerification, completeVerification } from "./age/verification";
import { balance, credit, COSTS } from "./tokens/ledger";
import { db } from "./store";

const img = Buffer.from("fake-webp").toString("base64");
const okFetch = vi.fn(async () => new Response(JSON.stringify({ data: [{ b64_json: img }] }), { status: 200 })) as unknown as typeof fetch;

beforeAll(() => {
  process.env.PORTRAIT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "portraits-"));
  process.env.OPENAI_API_KEY = "sk-test";
});
afterEach(() => vi.clearAllMocks());

const base = CharacterInput.parse({ name: "V", age: 30, hair: "red", eyes: "green", build: "curvy", style: "photoreal", personality: "confident", bodyShape: "hourglass", bust: "large", outfit: "lingerie" });

describe("portraits", () => {
  it("prompt is adult, clothed, fictional, and swaps lingerie for a dress", () => {
    const p = portraitPrompt({ ...base, id: "x", ownerId: "o", createdAt: 0 });
    expect(p).toContain("30 years old");
    expect(p).toContain("fully clothed");
    expect(p).toContain("not resembling any real person");
    expect(p).not.toContain("lingerie");
    expect(p).not.toContain("bust");
  });

  it("admin job generates all featured portraits and serves them", async () => {
    const r = startFeaturedPortraits("admin", false, okFetch) as { done: Promise<void> };
    await r.done;
    expect(featuredJobStatus().missing).toBe(0);
    expect(readPortrait("featured-1")?.type).toBe("image/webp");
  });

  it("user portrait charges tokens and refunds on failure", async () => {
    await beginVerification("pu1");
    await completeVerification("pu1");
    credit("pu1", 50, "t");
    db.characters.set("uc1", { ...base, id: "uc1", ownerId: "pu1", createdAt: 0 });
    await userPortrait("pu1", "uc1", okFetch);
    expect(balance("pu1")).toBe(50 - COSTS.image);
    const bad = vi.fn(async () => new Response("no", { status: 400 })) as unknown as typeof fetch;
    await expect(userPortrait("pu1", "uc1", bad)).rejects.toThrow("No tokens were used");
    expect(balance("pu1")).toBe(50 - COSTS.image);
    await expect(userPortrait("other", "uc1", okFetch)).rejects.toThrow();
  });
});
