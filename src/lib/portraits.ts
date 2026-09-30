import fs from "node:fs";
import path from "node:path";
import type { Character } from "./characters/schema";
import { SYSTEM_OWNER } from "./characters/schema";
import { ensureFeatured } from "./characters/featured";
import { requireVerifiedAdult, AccessDenied } from "./age/verification";
import { COSTS, credit, spend } from "./tokens/ledger";
import { audit, db, PMap } from "./store";
import { NEGATIVE_PROMPT } from "./characters/appearance";
import { getScanner, scanFailClosed, type SafetyScanner } from "./media/safety";

export function portraitDir(): string {
  if (process.env.PORTRAIT_DIR) return process.env.PORTRAIT_DIR;
  const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "data", "app.db");
  return path.join(dbPath === ":memory:" ? path.join(process.cwd(), "data") : path.dirname(dbPath), "portraits");
}

const g = globalThis as unknown as { __portraits?: PMap<{ file: string; at: number }> };
const portraits: PMap<{ file: string; at: number }> = (g.__portraits ??= new PMap(db.sql, "portraits"));

export const portraitVersion = (id: string) => portraits.get(id)?.at;

const w = (s: string) => s.replace(/_/g, " ");
/** Swimwear/lingerie become a glamorous dress so portraits stay SFW and pass the image provider's policy. */
const OUTFIT: Record<string, string> = { lingerie: "elegant silk slip dress", bikini: "stylish summer dress" };

/** Describes the figure in fashion-shoot terms (no body-part wording the image provider may reject). */
const FIGURE_EXTRA = (c: Character) => {
  const curvy = c.bust === "large" || c.bust === "extra_large" || c.hips === "wide" || c.hips === "extra_wide";
  return curvy ? (c.bust === "extra_large" || c.hips === "extra_wide" ? ", very voluptuous curvy silhouette" : ", voluptuous curvy silhouette") : "";
};

/** Attribute-only portrait prompt: always adult, clothed, fictional, waist-up. No user free text. */
export function portraitPrompt(c: Character): string {
  const who = c.gender === "male" ? "man" : "woman";
  const figure = c.gender === "female" ? `${w(c.bodyShape)} figure` : `${w(c.bodyShape)} build`;
  return [
    c.style === "anime"
      ? `High-quality anime illustration of a fictional adult ${who}, clearly ${c.age} years old, mature adult proportions`
      : `Photorealistic glamour portrait photo of a fictional adult ${who}, clearly ${c.age} years old`,
    `${w(c.ethnicity)}`,
    `${c.hair} ${w(c.hairStyle)} hair, ${c.eyes} eyes, ${figure}${c.gender === "female" ? FIGURE_EXTRA(c) : ""}`,
    `wearing a ${OUTFIT[c.outfit] ?? w(c.outfit)}`,
    `${c.personality} expression, confident pose, looking at the camera`,
    "three-quarter length fashion shot from head to mid-thigh showing figure and outfit, fully clothed, tasteful",
    c.style === "anime" ? "soft cel shading, vibrant colors" : "soft studio lighting, shallow depth of field, 85mm lens",
    "not resembling any real person, no text, no watermark",
  ].join(", ");
}

type Fetch = typeof fetch;

/** Self-hosted Stable Diffusion (AUTOMATIC1111 / Forge / SD.Next API): IMAGE_PROVIDER=sd, IMAGE_ENDPOINT=http://gpu:7860 */
const useSD = () => process.env.IMAGE_PROVIDER === "sd";
const SD_NEGATIVE = `${NEGATIVE_PROMPT}, nude, nudity, naked, nsfw, topless, underwear, lingerie, cleavage, deformed, extra limbs, lowres`;

async function generateSD(c: Character, fetchImpl: Fetch, scanner: () => SafetyScanner): Promise<{ data: Buffer; ext: string }> {
  const base = (process.env.IMAGE_ENDPOINT ?? "").replace(/\/$/, "");
  if (!base) throw new Error("IMAGE_ENDPOINT is not set");
  const res = await fetchImpl(`${base}/sdapi/v1/txt2img`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(process.env.IMAGE_API_KEY ? { authorization: `Bearer ${process.env.IMAGE_API_KEY}` } : {}) },
    body: JSON.stringify({ prompt: portraitPrompt(c), negative_prompt: SD_NEGATIVE, width: 832, height: 1216, steps: Number(process.env.IMAGE_STEPS ?? 28), cfg_scale: 6, sampler_name: "DPM++ 2M Karras" }),
    signal: AbortSignal.timeout(300_000),
  });
  if (!res.ok) throw new Error(`Stable Diffusion ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const b64 = ((await res.json()) as { images?: string[] }).images?.[0];
  if (!b64) throw new Error("Stable Diffusion returned no image");
  // Open models have no built-in safety: every image must pass the scanner (fails closed).
  const verdict = await scanFailClosed(scanner, `data:image/png;base64,${b64}`, "image/png");
  if (!verdict.ok) {
    audit({ userId: "system", kind: "portrait_blocked", category: verdict.category, detail: `${c.id} ${verdict.detail}` });
    throw new Error(`Picture blocked by safety check (${verdict.category})`);
  }
  return { data: Buffer.from(b64, "base64"), ext: "png" };
}

/** Generates a portrait (OpenAI Images, or self-hosted Stable Diffusion) and saves it. Returns the file name. */
export async function generatePortrait(c: Character, fetchImpl: Fetch = fetch, scanner: () => SafetyScanner = getScanner): Promise<string> {
  if (useSD()) {
    const { data, ext } = await generateSD(c, fetchImpl, scanner);
    return savePortrait(c, data, ext);
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  const gpt = model.startsWith("gpt-image");
  const res = await fetchImpl("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model, prompt: portraitPrompt(c), n: 1,
      ...(gpt
        ? { size: "1024x1536", quality: "medium", output_format: "webp", output_compression: 80, moderation: "auto" }
        : { size: "1024x1792", response_format: "b64_json" }),
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`OpenAI images ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const b = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = b.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image");
  return savePortrait(c, Buffer.from(b64, "base64"), gpt ? "webp" : "png");
}

/** Admin upload of a picture made elsewhere. Only PNG/JPEG/WebP up to 5 MB, checked by file signature. */
export function uploadPortrait(adminId: string, c: Character, data: Buffer): string {
  if (data.length > 5 * 1024 * 1024) throw new Error("Picture must be under 5 MB");
  const ext =
    data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? "png"
    : data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff ? "jpg"
    : data.subarray(0, 4).toString() === "RIFF" && data.subarray(8, 12).toString() === "WEBP" ? "webp"
    : null;
  if (!ext) throw new Error("Upload a PNG, JPEG or WebP picture");
  const file = savePortrait(c, data, ext);
  audit({ userId: adminId, kind: "portrait_uploaded", detail: `${c.id} ${file}` });
  return file;
}

function savePortrait(c: Character, data: Buffer, ext: string): string {
  const file = `${c.id}-${Date.now()}.${ext}`;
  fs.mkdirSync(portraitDir(), { recursive: true });
  fs.writeFileSync(path.join(portraitDir(), file), data);
  const old = portraits.get(c.id);
  portraits.set(c.id, { file, at: Date.now() });
  if (old) fs.rm(path.join(portraitDir(), old.file), { force: true }, () => {});
  return file;
}

export function readPortrait(id: string): { data: Buffer; type: string } | null {
  const p = portraits.get(id);
  if (!p) return null;
  const f = path.join(portraitDir(), path.basename(p.file));
  if (!fs.existsSync(f)) return null;
  return { data: fs.readFileSync(f), type: f.endsWith(".webp") ? "image/webp" : f.endsWith(".jpg") ? "image/jpeg" : "image/png" };
}

export const portraitsEnabled = () => (useSD() ? !!process.env.IMAGE_ENDPOINT : !!process.env.OPENAI_API_KEY);

/** User-created character portrait: owner only, costs an image's tokens, refunded on failure. */
export async function userPortrait(userId: string, characterId: string, fetchImpl: Fetch = fetch) {
  requireVerifiedAdult(userId);
  const c = db.characters.get(characterId);
  if (!c || c.ownerId !== userId) throw new AccessDenied("banned", "Character not found.", 404);
  spend(userId, COSTS.image, "portrait");
  try {
    await generatePortrait(c, fetchImpl);
    audit({ userId, kind: "portrait_generated", detail: characterId });
  } catch (e) {
    credit(userId, COSTS.image, "refund:portrait");
    audit({ userId, kind: "portrait_failed", detail: e instanceof Error ? e.message.slice(0, 200) : String(e) });
    throw new AccessDenied("banned", "Couldn't create the picture. No tokens were used.", 502);
  }
}

// Admin: generate all missing featured portraits in the background.
const job = { running: false, done: 0, failed: 0, total: 0, lastError: "" };
export const featuredJobStatus = () => ({ ...job, missing: missingFeatured().length });

function missingFeatured(): Character[] {
  ensureFeatured();
  return [...db.characters.values()].filter((c) => c.ownerId === SYSTEM_OWNER && !portraits.has(c.id));
}

export function startFeaturedPortraits(adminId: string, regenerateAll = false, fetchImpl: Fetch = fetch) {
  if (job.running) return featuredJobStatus();
  ensureFeatured();
  const list = regenerateAll ? [...db.characters.values()].filter((c) => c.ownerId === SYSTEM_OWNER) : missingFeatured();
  Object.assign(job, { running: true, done: 0, failed: 0, total: list.length, lastError: "" });
  audit({ userId: adminId, kind: "portraits_started", detail: String(list.length) });
  const done = (async () => {
    for (const c of list) {
      try { await generatePortrait(c, fetchImpl); job.done++; }
      catch (e) { job.failed++; job.lastError = e instanceof Error ? e.message.slice(0, 200) : String(e); }
    }
    job.running = false;
  })();
  return { ...featuredJobStatus(), done: done };
}

