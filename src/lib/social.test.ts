import { describe, expect, it, vi } from "vitest";
import { dailyPost, maybePostDaily, oauthHeader } from "./social";
import type { Character } from "./characters/schema";

const models = [{ id: "m1", name: "Aria Vale" }, { id: "m2", name: "Kira Lane" }] as Character[];

describe("daily social post", () => {
  it("rotates models and adds tracked links", () => {
    const a = dailyPost(Date.UTC(2026, 9, 6, 15), models)!;
    const b = dailyPost(Date.UTC(2026, 9, 7, 15), models)!;
    expect(a.model.id).not.toBe(b.model.id);
    expect(a.link("telegram")).toContain("utm_source=telegram");
  });
  it("signs X requests with OAuth 1.0a", () => {
    const h = oauthHeader("POST", "https://api.x.com/2/tweets", { ck: "a", cs: "b", at: "c", as: "d" }, "n", "1");
    expect(h).toMatch(/^OAuth .*oauth_signature="[^"]+"/);
  });
  it("does nothing before 8 pm IST or without keys", async () => {
    const f = vi.fn();
    expect(await maybePostDaily(Date.UTC(2026, 9, 6, 6), f as unknown as typeof fetch)).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
});
