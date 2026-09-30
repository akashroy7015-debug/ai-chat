import { describe, expect, it } from "vitest";
import { describeAppearance, NEGATIVE_PROMPT } from "./appearance";
import { CharacterInput } from "./schema";

describe("describeAppearance", () => {
  const c = {
    ...CharacterInput.parse({ name: "V", age: 30, hair: "red", eyes: "green", build: "curvy", style: "photoreal", personality: "confident", bodyShape: "hourglass", bust: "large", hips: "wide", outfit: "short_dress" }),
    id: "x", ownerId: "o", createdAt: 0,
  };
  it("includes figure and outfit and always states adult + fictional", () => {
    const d = describeAppearance(c);
    expect(d).toContain("hourglass figure, large bust, wide hips");
    expect(d).toContain("wearing short dress");
    expect(d).toContain("adult");
    expect(d).toContain("30 years old");
    expect(d).toContain("not resembling any real person");
  });
  it("never includes user free text", () => {
    expect(describeAppearance({ ...c, backstory: "SECRET", tagline: "SECRET" })).not.toContain("SECRET");
  });
  it("negative prompt excludes minors and real people", () => {
    expect(NEGATIVE_PROMPT).toMatch(/minor/);
    expect(NEGATIVE_PROMPT).toMatch(/real person/);
  });
});
