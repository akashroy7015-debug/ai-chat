import { describe, expect, it } from "vitest";
import { listFeatured } from "./featured";
import { canChatWith } from "./schema";

describe("featured catalog", () => {
  it("seeds adult-only characters", () => {
    const all = listFeatured();
    expect(all.length).toBeGreaterThan(10);
    expect(all.every((c) => c.age >= 18)).toBe(true);
  });
  it("filters by category", () => {
    expect(listFeatured({ category: "anime" }).every((c) => c.style === "anime")).toBe(true);
    expect(listFeatured({ category: "guys" }).every((c) => c.gender === "male")).toBe(true);
    expect(listFeatured({ category: "girls" }).every((c) => c.gender === "female" && c.style === "photoreal")).toBe(true);
  });
  it("filters by ethnicity and age range", () => {
    expect(listFeatured({ ethnicity: "latina" }).every((c) => c.ethnicity === "latina")).toBe(true);
    expect(listFeatured({ ageRange: "30s" }).every((c) => c.age >= 30 && c.age < 40)).toBe(true);
  });
  it("featured characters are chattable by anyone", () => {
    expect(canChatWith(listFeatured()[0], "anyone")).toBe(true);
  });
});
