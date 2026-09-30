import { describe, expect, it } from "vitest";
import { balance, credit, grantTrialOnce, InsufficientTokens, spend, FREE_TRIAL_TOKENS } from "./ledger";

describe("token ledger", () => {
  it("derives balance from entries", () => {
    credit("t1", 10, "topup");
    spend("t1", 3, "chat");
    expect(balance("t1")).toBe(7);
  });
  it("refuses overspend", () => {
    credit("t2", 2, "topup");
    expect(() => spend("t2", 5, "image")).toThrow(InsufficientTokens);
    expect(balance("t2")).toBe(2);
  });
  it("grants trial only once", () => {
    grantTrialOnce("t3");
    grantTrialOnce("t3");
    expect(balance("t3")).toBe(FREE_TRIAL_TOKENS);
  });
  it("rejects non-positive amounts", () => {
    expect(() => spend("t4", 0, "x")).toThrow();
    expect(() => credit("t4", -1, "x")).toThrow();
  });
});
