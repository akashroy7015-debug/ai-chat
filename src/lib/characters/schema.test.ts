import { describe, expect, it } from "vitest";
import { CharacterInput } from "./schema";

const base = {
  name: "Aria",
  age: 25,
  hair: "brown",
  eyes: "green",
  build: "athletic",
  style: "photoreal",
  personality: "calm",
  hobbies: ["hiking"],
  backstory: "Grew up by the coast and loves coffee.",
} as const;

describe("CharacterInput", () => {
  it("accepts a valid adult character", () => {
    expect(CharacterInput.safeParse(base).success).toBe(true);
  });
  it("rejects age under 18", () => {
    expect(CharacterInput.safeParse({ ...base, age: 17 }).success).toBe(false);
  });
  it("rejects minor-coded backstory", () => {
    expect(CharacterInput.safeParse({ ...base, backstory: "a schoolgirl next door" }).success).toBe(false);
  });
  it("rejects real-person names", () => {
    expect(CharacterInput.safeParse({ ...base, name: "Taylor Swift" }).success).toBe(false);
  });
  it("rejects likeness requests in hobbies", () => {
    expect(CharacterInput.safeParse({ ...base, hobbies: ["looks like my ex"] }).success).toBe(false);
  });
  it("rejects unknown enum values (no free-form appearance)", () => {
    expect(CharacterInput.safeParse({ ...base, hair: "teen" }).success).toBe(false);
  });
});
