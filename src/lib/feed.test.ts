import { describe, expect, it } from "vitest";
import { feed, toggleLike } from "./feed";

describe("feed", () => {
  it("lists posts from existing featured characters", () => {
    const f = feed();
    expect(f.length).toBeGreaterThan(10);
    expect(f.every((p) => p!.character.age >= 18)).toBe(true);
  });
  it("likes toggle per user", () => {
    const before = feed("fu1")[0]!.likes;
    expect(toggleLike("fu1", "post-1")).toBe(true);
    expect(feed("fu1")[0]!.liked).toBe(true);
    expect(feed("fu1")[0]!.likes).toBe(before + 1);
    expect(toggleLike("fu1", "post-1")).toBe(false);
    expect(() => toggleLike("fu1", "post-999")).toThrow();
  });
});
