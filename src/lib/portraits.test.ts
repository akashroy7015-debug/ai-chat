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
  it("prompt is adult and fictional; lingerie is shown as a catalogue shot, never nude", () => {
    const p = portraitPrompt({ ...base, id: "x", ownerId: "o", createdAt: 0 });
    expect(p).toContain("30 years old");
    expect(p).toContain("not resembling any real person");
    expect(p).toContain("lace lingerie set");
    expect(p).toContain("no nudity");
    const dress = portraitPrompt({ ...base, outfit: "cocktail_dress", id: "y", ownerId: "o", createdAt: 0 });
    expect(dress).toContain("fully clothed");
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

describe("manual review queue", () => {
  it("SD pictures wait for admin approval; approve publishes, reject discards", async () => {
    process.env.IMAGE_PROVIDER = "sd";
    process.env.IMAGE_ENDPOINT = "http://gpu:7860";
    process.env.SAFETY_SCANNER = "manual";
    const { generatePortrait, listPending, readPending, reviewPending } = await import("./portraits");
    const sdFetch = vi.fn(async () => new Response(JSON.stringify({ images: [img] }), { status: 200 })) as unknown as typeof fetch;
    const never = () => ({ scan: async () => { throw new Error("scanner must not be called in manual mode"); } });
    db.characters.set("mr1", { ...base, id: "mr1", ownerId: "system", createdAt: 0, featured: true });
    db.characters.set("mr2", { ...base, id: "mr2", ownerId: "system", createdAt: 0, featured: true });
    await generatePortrait(db.characters.get("mr1")!, sdFetch, never);
    await generatePortrait(db.characters.get("mr2")!, sdFetch, never);
    expect(readPortrait("mr1")).toBeNull();
    expect(listPending().map((p) => p.id)).toEqual(expect.arrayContaining(["mr1", "mr2"]));
    expect(readPending("mr1")).not.toBeNull();
    reviewPending("admin", "mr1", true);
    reviewPending("admin", "mr2", false);
    expect(readPortrait("mr1")?.type).toBe("image/png");
    expect(readPortrait("mr2")).toBeNull();
    expect(listPending().some((p) => p.id === "mr1" || p.id === "mr2")).toBe(false);
    delete process.env.IMAGE_PROVIDER; delete process.env.IMAGE_ENDPOINT; delete process.env.SAFETY_SCANNER;
  });
});

describe("model video clips", () => {
  it("accepts MP4/WebM by signature, rejects others, can remove", async () => {
    const { uploadClip, readClip, removeClip } = await import("./portraits");
    const c = { ...base, id: "clip1", ownerId: "system", createdAt: 0 };
    const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypmp42"), Buffer.alloc(32)]);
    uploadClip("admin", c, mp4);
    expect(readClip("clip1")?.type).toBe("video/mp4");
    expect(() => uploadClip("admin", c, Buffer.from("not a video at all"))).toThrow("MP4 or WebM");
    removeClip("clip1");
    expect(readClip("clip1")).toBeNull();
  });
});

describe("resized portraits", () => {
  it("makes a smaller WebP copy and caches it", async () => {
    const sharp = (await import("sharp")).default;
    const { resizedPortrait, uploadPortrait } = await import("./portraits");
    const png = await sharp({ create: { width: 1200, height: 1600, channels: 3, background: "#c94a6e" } }).png().toBuffer();
    uploadPortrait("admin", { ...base, id: "rs", ownerId: "o", createdAt: 0 }, png);
    const small = await resizedPortrait("rs", 300);
    expect(small?.type).toBe("image/webp");
    expect((await sharp(small!.data).metadata()).width).toBe(400);
    expect((await resizedPortrait("rs", 300))?.data.length).toBe(small!.data.length);
  });
});
