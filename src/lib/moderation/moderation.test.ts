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

describe("moderateText: explicit opt-in", () => {
  it("allows explicit terms only when eligible AND globally enabled", () => {
    process.env.ALLOW_EXPLICIT = "true";
    expect(moderateText("send nudes", { explicitAllowed: true }).allowed).toBe(true);
    expect(moderateText("send nudes").allowed).toBe(false);
    delete process.env.ALLOW_EXPLICIT;
    expect(moderateText("send nudes", { explicitAllowed: true }).allowed).toBe(false);
  });
  it("never relaxes minor or real-person checks", () => {
    process.env.ALLOW_EXPLICIT = "true";
    expect(moderateText("naked 17 yo", { explicitAllowed: true }).allowed).toBe(false);
    expect(moderateText("nude schoolgirl", { explicitAllowed: true }).allowed).toBe(false);
    expect(moderateText("nude Taylor Swift", { explicitAllowed: true }).allowed).toBe(false);
    delete process.env.ALLOW_EXPLICIT;
  });
});

describe("detectSelfHarm", () => {
  it("detects", () => expect(detectSelfHarm("I want to die")).toBe(true));
  it("ignores normal text", () => expect(detectSelfHarm("nice day")).toBe(false));
});

describe("moderateText: Hindi / Hinglish", () => {
  it.each([
    "wo 16 saal ki hai",
    "meri umar 15 hai",
    "solah saal ki ladki",
    "वो 16 साल की है",
    "वो १६ साल की है",
    "सत्रह साल",
    "school wali ladki",
    "ek chhoti ladki",
    "nabalig",
    "वो एक बच्ची है",
    "नाबालिग लड़की",
    "स्कूल की लड़की",
  ])("blocks minor content: %s", (t) => {
    const r = moderateText(t);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.category).toBe("minor");
  });

  it.each(["meri umar 25 hai", "wo 30 saal ki hai", "मैं 24 साल की हूँ", "kya haal hai jaan? aaj bahut yaad aayi", "आज मौसम बहुत अच्छा है"])(
    "allows adult / normal talk: %s",
    (t) => expect(moderateText(t).allowed).toBe(true),
  );

  it("blocks Hindi explicit slang under the default policy", () => {
    expect(moderateText("nangi photo bhejo").allowed).toBe(false);
    expect(moderateText("नंगी फोटो").allowed).toBe(false);
  });
});

describe("moderateText: time phrases are not ages", () => {
  it.each(["10 saal pehle main Delhi gaya", "das saal pehle", "5 years ago I moved", "15 साल पहले", "2 saal se yahan hoon"])(
    "allows %s",
    (t) => expect(moderateText(t).allowed).toBe(true),
  );
  it("still blocks a stated minor age", () => expect(moderateText("she is 15 years old").allowed).toBe(false));
});
