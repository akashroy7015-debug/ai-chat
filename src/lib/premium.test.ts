import { describe, expect, it } from "vitest";
import { activatePlan, applyMonthlyGrant, chatIsFree, isPremium, MONTHLY_TOKENS, planDiscountPct } from "./premium";
import { balance } from "./tokens/ledger";
import { getUser } from "./store";

const DAY = 86_400_000;

describe("premium", () => {
  it("advertised discounts are real", () => {
    expect(planDiscountPct("monthly")).toBe(0);
    expect(planDiscountPct("quarterly")).toBe(30);
    expect(planDiscountPct("yearly")).toBe(70);
  });
  it("activates, grants tokens once per month, and stacks renewals", () => {
    const now = Date.now();
    activatePlan("p1", "monthly", now);
    expect(isPremium(getUser("p1"), now)).toBe(true);
    expect(balance("p1")).toBe(MONTHLY_TOKENS);
    applyMonthlyGrant("p1", now + DAY);
    expect(balance("p1")).toBe(MONTHLY_TOKENS);
    const end = getUser("p1").premiumUntil!;
    activatePlan("p1", "monthly", now + DAY);
    expect(getUser("p1").premiumUntil).toBe(end + 30 * DAY);
  });
  it("yearly users get a grant each month", () => {
    const now = Date.now();
    activatePlan("p2", "yearly", now);
    applyMonthlyGrant("p2", now + 31 * DAY);
    expect(balance("p2")).toBe(2 * MONTHLY_TOKENS);
  });
  it("expires", () => {
    const now = Date.now();
    activatePlan("p3", "monthly", now);
    expect(isPremium(getUser("p3"), now + 31 * DAY)).toBe(false);
    expect(chatIsFree("p3", now + 31 * DAY)).toBe(false);
    expect(chatIsFree("p3", now)).toBe(true);
  });
});
