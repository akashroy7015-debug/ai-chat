import fs from "node:fs";
import path from "node:path";
import type { Character } from "./characters/schema";
import { portraitDir } from "./portraits";
import { isPremium } from "./premium";
import { isAdmin } from "./admin";
import { audit, db, getUser, newId, PMap } from "./store";

// Extra photos and videos of a model, locked behind Premium.
export interface GalleryItem { id: string; characterId: string; file: string; kind: "image" | "video"; at: number }
const g = globalThis as unknown as { __gallery?: PMap<GalleryItem> };
const items: PMap<GalleryItem> = (g.__gallery ??= new PMap(db.sql, "gallery"));

function sniff(data: Buffer): { kind: GalleryItem["kind"]; ext: string } | null {
  if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { kind: "image", ext: "png" };
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return { kind: "image", ext: "jpg" };
  if (data.subarray(0, 4).toString() === "RIFF" && data.subarray(8, 12).toString() === "WEBP") return { kind: "image", ext: "webp" };
  if (data.subarray(4, 8).toString() === "ftyp") return { kind: "video", ext: "mp4" };
  if (data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return { kind: "video", ext: "webm" };
  return null;
}

/** Admin adds a photo (PNG/JPEG/WebP, 8 MB) or video (MP4/WebM, 30 MB), checked by file signature. */
export function addGalleryItem(adminId: string, c: Character, data: Buffer): GalleryItem {
  const t = sniff(data);
  if (!t) throw new Error("Upload a PNG, JPEG, WebP picture or an MP4/WebM video");
  if (data.length > (t.kind === "image" ? 8 : 30) * 1024 * 1024) throw new Error(t.kind === "image" ? "Picture must be under 8 MB" : "Video must be under 30 MB");
  const id = newId();
  const file = `gal-${c.id}-${id}.${t.ext}`;
  fs.mkdirSync(portraitDir(), { recursive: true });
  fs.writeFileSync(path.join(portraitDir(), file), data);
  const item: GalleryItem = { id, characterId: c.id, file, kind: t.kind, at: Date.now() };
  items.set(id, item);
  audit({ userId: adminId, kind: "gallery_uploaded", detail: `${c.id} ${file}` });
  return item;
}

export function removeGalleryItem(adminId: string, id: string) {
  const it = items.get(id);
  if (!it) return;
  items.delete(id);
  fs.rm(path.join(portraitDir(), path.basename(it.file)), { force: true }, () => {});
  audit({ userId: adminId, kind: "gallery_removed", detail: `${it.characterId} ${it.file}` });
}

export const listGallery = (characterId: string) => [...items.values()].filter((i) => i.characterId === characterId).sort((a, b) => a.at - b.at);

/** Premium members and admins see everything; everyone else only sees that locked items exist. */
export function canView(userId: string | undefined): boolean {
  if (!userId) return false;
  const u = getUser(userId);
  if (u.banned) return false;
  return isAdmin(userId) || (u.ageStatus === "verified" && isPremium(u));
}

export function readGalleryItem(id: string): { path: string; type: string; size: number } | null {
  const it = items.get(id);
  if (!it) return null;
  const f = path.join(portraitDir(), path.basename(it.file));
  if (!fs.existsSync(f)) return null;
  const ext = path.extname(f).slice(1);
  const type = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", mp4: "video/mp4", webm: "video/webm" }[ext] ?? "application/octet-stream";
  return { path: f, type, size: fs.statSync(f).size };
}
