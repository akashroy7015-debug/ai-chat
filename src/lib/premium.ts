import { credit } from "./tokens/ledger";
import { audit, getUser, saveUser, type User } from "./store";

const DAY = 86_400_000;
export const MONTH = 30 * DAY;

/**
 * One-time payments in rupees (India, GST included) or US dollars (everyone else). Plans never renew automatically.
 * `credits` is the allowance granted each month of the plan (chat 1, voice 5, photo 20);
 * the cheaper-per-month long plans get a smaller allowance, so heavy users top up.
 */
export const PLANS = {
  monthly: { label: "1 month", months: 1, priceInr: 999, priceUsd: 12.99, credits: 400 },
  quarterly: { label: "3 months", months: 3, priceInr: 2097, priceUsd: 26.99, credits: 350 },
  yearly: { label: "12 months", months: 12, priceInr: 3588, priceUsd: 46.99, credits: 300 },
} as const;
/** Credits per month on the monthly plan. */
export const MONTHLY_TOKENS = PLANS.monthly.credits;
const creditsFor = (plan: string | undefined) => PLANS[(plan ?? "monthly") as PlanId]?.credits ?? MONTHLY_TOKENS;
export type PlanId = keyof typeof PLANS;

/** Discount vs paying monthly, computed rather than claimed. */
export function planDiscountPct(plan: PlanId): number {
  const p = PLANS[plan];
  return Math.round((1 - p.priceInr / (PLANS.monthly.priceInr * p.months)) * 100);
}
export const perMonth = (plan: PlanId) => Math.round(PLANS[plan].priceInr / PLANS[plan].months);
export const perMonthUsd = (plan: PlanId) => Math.round((PLANS[plan].priceUsd / PLANS[plan].months) * 100) / 100;

export function isPremium(u: User, now = Date.now()): boolean {
  return (u.premiumUntil ?? 0) > now;
}

/** Called after a paid subscription order. Extends from the current end date if still active. */
export function activatePlan(userId: string, plan: PlanId, now = Date.now()) {
  const u = getUser(userId);
  const start = Math.max(u.premiumUntil ?? 0, now);
  u.premiumUntil = start + PLANS[plan].months * MONTH;
  u.premiumPlan = plan;
  if (!u.premiumLastGrant || now - u.premiumLastGrant >= MONTH) {
    credit(userId, creditsFor(plan), `premium_grant:${plan}`);
    u.premiumLastGrant = now;
  }
  saveUser(u);
  audit({ userId, kind: "premium_activated", detail: `${plan} until ${new Date(u.premiumUntil).toISOString()}` });
}

/** Grants the monthly token allowance when due. Safe to call on every request. */
export function applyMonthlyGrant(userId: string, now = Date.now()) {
  const u = getUser(userId);
  if (!isPremium(u, now) || !u.premiumLastGrant || now - u.premiumLastGrant < MONTH) return;
  credit(userId, creditsFor(u.premiumPlan), `premium_grant:${u.premiumPlan ?? "monthly"}`);
  u.premiumLastGrant = now;
  saveUser(u);
}
