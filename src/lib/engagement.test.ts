import { describe, expect, it } from "vitest";
import { claimDaily, dailyStatus, relationship } from "./engagement";
import { balance } from "./tokens/ledger";
import { db } from "./store";

const DAY = 86_400_000;

describe("daily streak", () => {
  it("grants once per day, grows the streak, resets after a missed day", () => {
    const t0 = Date.UTC(2026, 9, 1, 6);
    expect(claimDaily("d1", t0).granted).toBe(5);
    expect(claimDaily("d1", t0 + 1000).granted).toBe(0);
    expect(claimDaily("d1", t0 + DAY).granted).toBe(6);
    expect(dailyStatus("d1", t0 + DAY).streak).toBe(2);
    expect(claimDaily("d1", t0 + 3 * DAY).granted).toBe(5); // missed a day
    expect(balance("d1")).toBe(16);
  });
});

describe("relationship level", () => {
  it("levels up with messages", () => {
    expect(relationship("r1", "featured-1").name).toBe("Stranger");
    for (let i = 0; i < 12; i++) db.messages.push({ id: `rm${i}`, userId: "r1", characterId: "featured-1", role: "user", content: "hi", at: i });
    const r = relationship("r1", "featured-1");
    expect(r.name).toBe("Crush");
    expect(r.nextName).toBe("Date");
  });
});

describe("surprise photos and top fans", async () => {
  const { maybeSurprisePhoto, topFans, fanHandle } = await import("./engagement");
  it("only from Date level, needs media, not too often", () => {
    const u = "sp1";
    expect(maybeSurprisePhoto(u, "featured-2", 1, { portrait: true, clip: false }, 0)).toBeNull(); // stranger
    for (let i = 0; i < 31; i++) db.messages.push({ id: `sp${i}`, userId: u, characterId: "featured-2", role: "user", content: "x", at: i });
    expect(maybeSurprisePhoto(u, "featured-2", 2, { portrait: false, clip: false }, 0)).toBeNull(); // no media
    const p = maybeSurprisePhoto(u, "featured-2", 2, { portrait: true, clip: false }, 0.9)!; // just reached Date
    expect(p.image).toBe("portrait");
    db.messages.push({ id: "spimg", userId: u, characterId: "featured-2", role: "assistant", content: p.content, image: "portrait", at: 99 });
    expect(maybeSurprisePhoto(u, "featured-2", 3, { portrait: true, clip: false }, 0)).toBeNull(); // too soon
  });
  it("ranks fans anonymously", () => {
    const now = Date.now();
    for (let i = 0; i < 5; i++) db.messages.push({ id: `tf${i}`, userId: "fanA", characterId: "featured-9", role: "user", content: "x", at: now });
    db.messages.push({ id: "tfb", userId: "fanB", characterId: "featured-9", role: "user", content: "x", at: now });
    const r = topFans("featured-9", "fanB", now);
    expect(r.top[0].handle).toBe(fanHandle("fanA"));
    expect(r.top[0].handle).not.toContain("fanA");
    expect(r.yourRank).toBe(2);
  });
});
