import { describe, expect, it } from "vitest";
import { countryFromHeaders, explicitAllowedIn } from "./jurisdiction";

describe("jurisdiction", () => {
  it("blocks India by request or ID country", () => {
    expect(explicitAllowedIn("IN", "US")).toBe(false);
    expect(explicitAllowedIn("US", "IN")).toBe(false);
    expect(explicitAllowedIn("in", "gb")).toBe(false);
  });
  it("fails closed on unknown country", () => {
    expect(explicitAllowedIn(undefined, "US")).toBe(false);
    expect(explicitAllowedIn("US", undefined)).toBe(false);
  });
  it("allows where not blocked", () => expect(explicitAllowedIn("US", "US")).toBe(true));
  it("reads CDN headers and ignores unknown/Tor codes", () => {
    expect(countryFromHeaders(new Headers({ "cf-ipcountry": "IN" }))).toBe("IN");
    expect(countryFromHeaders(new Headers({ "cf-ipcountry": "XX" }))).toBeUndefined();
    expect(countryFromHeaders(new Headers({ "cf-ipcountry": "T1" }))).toBeUndefined();
  });
});
