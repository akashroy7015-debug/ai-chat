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

describe("self-hosted Stable Diffusion portraits", () => {
  const sdFetch = vi.fn(async () => new Response(JSON.stringify({ images: [img] }), { status: 200 })) as unknown as typeof fetch;
  const c = { ...base, id: "sd1", ownerId: "system", createdAt: 0 };
  const scanner = (r: Partial<{ csamMatch: boolean; minApparentAge: number | null; realPersonSimilarity: number }>) => () => ({
    scan: async () => ({ csamMatch: false, minApparentAge: 30, realPersonSimilarity: 0, ...r }),
  });

  it("saves when the scan passes, sends the negative prompt", async () => {
    process.env.IMAGE_PROVIDER = "sd";
    process.env.IMAGE_ENDPOINT = "http://gpu:7860/";
    const { generatePortrait } = await import("./portraits");
    await generatePortrait(c, sdFetch, scanner({}));
    const [url, init] = (sdFetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("http://gpu:7860/sdapi/v1/txt2img");
    expect(JSON.parse(String(init.body)).negative_prompt).toMatch(/minor/);
    expect(readPortrait("sd1")?.type).toBe("image/png");
  });

  it("blocks young-looking output and fails closed when the scanner errors", async () => {
    const { generatePortrait } = await import("./portraits");
    const c2 = { ...c, id: "sd2" };
    await expect(generatePortrait(c2, sdFetch, scanner({ minApparentAge: 15 }))).rejects.toThrow("blocked");
    await expect(generatePortrait(c2, sdFetch, () => ({ scan: async () => { throw new Error("down"); } }))).rejects.toThrow("blocked");
    expect(readPortrait("sd2")).toBeNull();
    delete process.env.IMAGE_PROVIDER;
    delete process.env.IMAGE_ENDPOINT;
  });
});

describe("admin upload", () => {
  it("accepts PNG/JPEG/WebP by signature and rejects others", async () => {
    const { uploadPortrait } = await import("./portraits");
    const c = { ...base, id: "up1", ownerId: "system", createdAt: 0 };
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(20)]);
    uploadPortrait("admin", c, png);
    expect(readPortrait("up1")?.type).toBe("image/png");
    const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(20)]);
    uploadPortrait("admin", c, jpg);
    expect(readPortrait("up1")?.type).toBe("image/jpeg");
    expect(() => uploadPortrait("admin", c, Buffer.from("<svg onload=alert(1)>"))).toThrow("PNG, JPEG or WebP");
    expect(() => uploadPortrait("admin", c, Buffer.alloc(6 * 1024 * 1024, 0x89))).toThrow("5 MB");
  });
});
