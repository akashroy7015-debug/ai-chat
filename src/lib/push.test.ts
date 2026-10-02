import { describe, expect, it, vi } from "vitest";
import { isSubscribed, notifyInactive, publicKey, subscribe } from "./push";
import { db } from "./store";

const sub = { endpoint: "https://push.example/abc", keys: { p256dh: "BNcR", auth: "tBHI" } };

describe("push", () => {
  it("creates VAPID keys once", () => {
    expect(publicKey()).toBe(publicKey());
  });
  it("nudges inactive users once a day and drops expired subscriptions", async () => {
    const now = Date.now();
    subscribe("pu1", sub);
    db.messages.push({ id: "pm1", userId: "pu1", characterId: "featured-1", role: "user", content: "hi", at: now - 21 * 3_600_000 });
    const send = vi.fn(async () => ({}) as never);
    expect(await notifyInactive(now, send)).toBe(1);
    expect(JSON.parse((send.mock.calls[0] as unknown as [unknown, string])[1]).url).toBe("/chat?c=featured-1");
    expect(await notifyInactive(now + 1000, send)).toBe(0);
    const gone = vi.fn(async () => { throw Object.assign(new Error("gone"), { statusCode: 410 }); });
    expect(await notifyInactive(now + 25 * 3_600_000, gone as never)).toBe(0);
    expect(isSubscribed("pu1")).toBe(false);
  });
  it("rejects non-https endpoints", () => {
    expect(() => subscribe("pu2", { ...sub, endpoint: "http://evil" })).toThrow();
  });
});
