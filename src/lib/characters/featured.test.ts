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
  it("milf category is women 35+", () => {
    const m = listFeatured({ category: "milf" });
    expect(m.length).toBeGreaterThanOrEqual(4);
    expect(m.every((c) => c.gender === "female" && c.age >= 35)).toBe(true);
  });
  it("filters by ethnicity and age range", () => {
    expect(listFeatured({ ethnicity: "latina" }).every((c) => c.ethnicity === "latina")).toBe(true);
    expect(listFeatured({ ageRange: "30s" }).every((c) => c.age >= 30 && c.age < 40)).toBe(true);
  });
  it("featured characters are chattable by anyone", () => {
    expect(canChatWith(listFeatured()[0], "anyone")).toBe(true);
  });
});

describe("admin-managed models", async () => {
  const { createFeatured, updateFeatured, setFeaturedHidden, allFeatured } = await import("./featured");
  const base = { name: "Zara", age: 27, hair: "black", eyes: "brown", build: "curvy", style: "photoreal", personality: "confident", bodyShape: "hourglass" };
  it("creates, edits, hides; validation still applies", () => {
    const c = createFeatured(base);
    expect(listFeatured().some((x) => x.id === c.id)).toBe(true);
    updateFeatured(c.id, { ...base, tagline: "hey you" });
    expect(allFeatured().find((x) => x.id === c.id)!.tagline).toBe("hey you");
    setFeaturedHidden(c.id, true);
    expect(listFeatured().some((x) => x.id === c.id)).toBe(false);
    expect(canChatWith(allFeatured().find((x) => x.id === c.id)!, "anyone")).toBe(false);
    expect(() => createFeatured({ ...base, age: 17 })).toThrow();
    expect(() => createFeatured({ ...base, name: "Taylor Swift" })).toThrow();
  });
});

describe("extra models", () => {
  it("loads models from extra-models.json into the catalog", () => {
    expect(listFeatured({ category: "girls" }).some((c) => c.id === "featured-isabela" && c.age >= 18)).toBe(true);
  });
});

describe("extra-models updates", () => {
  it("applies a higher rev to an existing model once", () => {
    const aria = listFeatured().find((c) => c.id === "featured-1")!;
    expect(aria.hair).toBe("blonde");
    expect(aria.outfit).toBe("bralette_top");
    expect(aria.rev).toBe(2);
  });
});
