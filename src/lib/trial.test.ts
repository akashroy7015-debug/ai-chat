import { describe, expect, it } from "vitest";
import { canonicalEmail, grantTrialIfEligible } from "./trial";
import { balance, FREE_TRIAL_TOKENS } from "./tokens/ledger";
import { getUser, saveUser } from "./store";

const user = (id: string, email: string) => { const u = getUser(id); u.email = email; saveUser(u); return id; };

describe("free trial abuse protection", () => {
  it("treats Gmail dot and +tag variants as one inbox", () => {
    expect(canonicalEmail("Ra.Hul+free2@GMAIL.com")).toBe("rahul@gmail.com");
    expect(canonicalEmail("rahul@googlemail.com")).toBe("rahul@gmail.com");
    expect(canonicalEmail("a+x@outlook.com")).toBe("a@outlook.com");
  });
  it("grants once per account and once per inbox", () => {
    expect(grantTrialIfEligible(user("t1", "rahul.k@gmail.com"), "1.1.1.1")).toBe(true);
    expect(grantTrialIfEligible("t1", "1.1.1.1")).toBe(false);
    expect(balance("t1")).toBe(FREE_TRIAL_TOKENS);
    expect(grantTrialIfEligible(user("t2", "rahulk+2@gmail.com"), "9.9.9.9")).toBe(false);
    expect(balance("t2")).toBe(0);
  });
  it("limits trials per network and blocks throwaway emails", () => {
    expect(grantTrialIfEligible(user("t3", "one@example.com"), "2.2.2.2")).toBe(true);
    expect(grantTrialIfEligible(user("t4", "two@example.com"), "2.2.2.2")).toBe(true);
    expect(grantTrialIfEligible(user("t5", "three@example.com"), "2.2.2.2")).toBe(false);
    expect(grantTrialIfEligible(user("t6", "x@mailinator.com"), "3.3.3.3")).toBe(false);
  });
});
