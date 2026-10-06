import { describe, expect, it } from "vitest";
import { attributeSignup, REFERRAL_BONUS, referralCode, referralStats } from "./referral";
import { grantTrialIfEligible } from "./trial";
import { balance } from "./tokens/ledger";
import { getUser, saveUser } from "./store";

const user = (id: string, email: string) => { const u = getUser(id); u.email = email; saveUser(u); return id; };

describe("invite a friend", () => {
  it("rewards both people once the friend signs up with a real trial", () => {
    const code = referralCode(user("inv", "inviter@example.com"));
    expect(referralCode("inv")).toBe(code);
    const friend = user("fr1", "friend1@example.com");
    grantTrialIfEligible(friend, "5.5.5.5");
    attributeSignup(friend, code.toUpperCase(), "twitter");
    expect(balance("inv")).toBe(REFERRAL_BONUS);
    expect(balance(friend)).toBeGreaterThan(REFERRAL_BONUS);
    expect(getUser(friend).signupSource).toBe("invite");
    expect(referralStats("inv")).toMatchObject({ invited: 1, earned: REFERRAL_BONUS });
  });
  it("pays nothing for throwaway/repeat accounts or self-invites, but records the source", () => {
    const code = referralCode(user("inv2", "inviter2@example.com"));
    const fake = user("fr2", "x@mailinator.com");
    grantTrialIfEligible(fake, "6.6.6.6");
    attributeSignup(fake, code, undefined);
    expect(balance("inv2")).toBe(0);
    attributeSignup("inv2", code, undefined);
    expect(balance("inv2")).toBe(0);
    attributeSignup(user("fr3", "z@example.com"), undefined, "Reddit<script>");
    expect(getUser("fr3").signupSource).toBe("redditscript");
  });
});
