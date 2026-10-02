import { describe, expect, it } from "vitest";
import { AccessDenied, beginVerification, completeVerification, explicitAllowed, requireVerifiedAdult } from "./verification";
import { getUser } from "../store";

describe("age gate", () => {
  it("blocks unverified users", () => {
    expect(() => requireVerifiedAdult("u-unverified")).toThrow(AccessDenied);
  });
  it("allows after verification", async () => {
    await beginVerification("u-ok");
    expect(() => requireVerifiedAdult("u-ok")).toThrow(); // still pending
    expect(await completeVerification("u-ok")).toBe("verified");
    expect(requireVerifiedAdult("u-ok").id).toBe("u-ok");
  });
  it("explicit needs flag + ID + opt-in", async () => {
    await beginVerification("u-x");
    const u = getUser("u-x");
    expect(explicitAllowed(u)).toBe(false);
    await completeVerification("u-x");
    u.explicitOptIn = true;
    u.idCountry = "GB";
    u.lastCountry = "GB";
    expect(explicitAllowed(u)).toBe(false); // global flag off
    process.env.ALLOW_EXPLICIT = "true";
    expect(explicitAllowed(u)).toBe(true);
    u.lastCountry = "IN";
    expect(explicitAllowed(u)).toBe(false); // India: never
    u.lastCountry = "GB";
    u.idCountry = "IN";
    expect(explicitAllowed(u)).toBe(false); // Indian ID abroad: never
    u.idCountry = undefined;
    expect(explicitAllowed(u)).toBe(false); // unknown: fail closed
    u.idCountry = "GB";
    u.banned = true;
    expect(explicitAllowed(u)).toBe(false);
    delete process.env.ALLOW_EXPLICIT;
  });
  it("blocks banned users even if verified", async () => {
    await beginVerification("u-ban");
    await completeVerification("u-ban");
    getUser("u-ban").banned = true;
    expect(() => requireVerifiedAdult("u-ban")).toThrow(AccessDenied);
  });
});

describe("age gate (date of birth)", () => {
  it("works out age correctly around birthdays", async () => {
    const { ageFromBirthDate } = await import("./verification");
    const now = new Date(Date.UTC(2026, 9, 2));
    expect(ageFromBirthDate("2008-10-02", now)).toBe(18);
    expect(ageFromBirthDate("2008-10-03", now)).toBe(17);
    expect(ageFromBirthDate("2008-02-30", now)).toBeNull();
    expect(ageFromBirthDate("nonsense", now)).toBeNull();
  });
  it("lets adults in and locks out under-18s for good", async () => {
    const { selfDeclareAge } = await import("./verification");
    const { getUser } = await import("../store");
    expect(selfDeclareAge("ag1", "1995-05-05").ageStatus).toBe("verified");
    expect(getUser("ag1").ageMethod).toBe("self_declared");
    expect(() => selfDeclareAge("ag2", `${new Date().getUTCFullYear() - 15}-01-01`)).toThrow("18");
    expect(() => selfDeclareAge("ag2", "1990-01-01")).toThrow("adults 18+");
  });
});
