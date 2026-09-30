import { describe, expect, it } from "vitest";
import { AccessDenied, beginVerification, completeVerification, requireVerifiedAdult } from "./verification";
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
  it("blocks banned users even if verified", async () => {
    await beginVerification("u-ban");
    await completeVerification("u-ban");
    getUser("u-ban").banned = true;
    expect(() => requireVerifiedAdult("u-ban")).toThrow(AccessDenied);
  });
});
