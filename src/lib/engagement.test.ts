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
