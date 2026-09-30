import { describe, expect, it } from "vitest";
import { detectSelfHarm, moderateText } from "./index";

const blocked = (t: string) => moderateText(t);

describe("moderateText: minors", () => {
  it.each([
    "she is 17 years old",
    "a 15 yo girl",
    "age 16",
    "12-year-old",
    "aged 13",
    "my 17th birthday",
    "a schoolgirl",
    "high school student",
    "l0li",
    "t33nager",
    "childlike innocence",
  ])("blocks %s", (t) => {
    const r = blocked(t);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.category).toBe("minor");
  });

  it.each(["she is 24 years old", "age 30", "a 19 yo nurse", "18 years old"])(
    "allows %s",
    (t) => expect(blocked(t).allowed).toBe(true),
  );
});

describe("moderateText: real people", () => {
  it.each([
    "make her look like Taylor Swift",
    "resembles a celebrity",
    "a lookalike of my coworker",
    "T4ylor Sw1ft",
    "face swap this photo",
  ])("blocks %s", (t) => {
    const r = blocked(t);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.category).toBe("real_person");
  });
});

describe("moderateText: explicit (default policy)", () => {
  it("blocks explicit terms", () => {
    const r = blocked("send me nudes");
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.category).toBe("explicit");
  });
  it("allows romance", () => {
    expect(blocked("I missed you today, want to watch the sunset together?").allowed).toBe(true);
  });
  it("does not false-positive on substrings", () => {
    expect(blocked("Scunthorpe is a classic, analysis of the class").allowed).toBe(true);
  });
});

describe("detectSelfHarm", () => {
  it("detects", () => expect(detectSelfHarm("I want to die")).toBe(true));
  it("ignores normal text", () => expect(detectSelfHarm("nice day")).toBe(false));
});
