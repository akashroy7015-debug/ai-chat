import { beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { addGalleryItem, canView, listGallery, readGalleryItem, removeGalleryItem } from "./gallery";
import { activatePlan } from "./premium";
import { getUser, newId } from "./store";
import type { Character } from "./characters/schema";

beforeAll(() => { process.env.PORTRAIT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "gallery-")); });

const c = { id: "gal-model" } as Character;
const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(20)]);
const mp4 = Buffer.concat([Buffer.alloc(4), Buffer.from("ftyp"), Buffer.alloc(20)]);

describe("premium gallery", () => {
  it("stores photos and videos by signature and rejects anything else", () => {
    expect(addGalleryItem("admin", c, jpg).kind).toBe("image");
    expect(addGalleryItem("admin", c, mp4).kind).toBe("video");
    expect(() => addGalleryItem("admin", c, Buffer.from("<html>"))).toThrow();
    expect(listGallery(c.id)).toHaveLength(2);
  });

  it("is locked for guests, free users and unverified users; open for verified Premium", () => {
    expect(canView(undefined)).toBe(false);
    const id = newId();
    const u = getUser(id);
    expect(canView(id)).toBe(false);
    activatePlan(id, "monthly");
    expect(canView(id)).toBe(false);
    u.ageStatus = "verified";
    expect(canView(id)).toBe(true);
  });

  it("removes the file", () => {
    const [first] = listGallery(c.id);
    removeGalleryItem("admin", first.id);
    expect(readGalleryItem(first.id)).toBeNull();
    expect(listGallery(c.id)).toHaveLength(1);
  });
});
