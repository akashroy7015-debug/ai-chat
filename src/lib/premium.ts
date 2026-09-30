import { credit } from "./tokens/ledger";
import { audit, db, getUser, saveUser, type User } from "./store";

const DAY = 86_400_000;
const MONTH = 30 * DAY;

export const MONTHLY_TOKENS = 1000;
/** Fair-use cap on free chat messages for Premium users. */
export const PREMIUM_DAILY_CHAT_CAP = 300;

export const PLANS = {
  monthly: { label: "1 month", months: 1, priceUsd: 19.99 },
  quarterly: { label: "3 months", months: 3, priceUsd: 41.97 },
  yearly: { label: "12 months", months: 12, priceUsd: 71.88 },
} as const;
export type PlanId = keyof typeof PLANS;

/** Discount vs paying monthly, computed rather than claimed. */
export function planDiscountPct(plan: PlanId): number {
  const p = PLANS[plan];
  return Math.round((1 - p.priceUsd / (PLANS.monthly.priceUsd * p.months)) * 100);
}
export const perMonth = (plan: PlanId) => Math.round((PLANS[plan].priceUsd / PLANS[plan].months) * 100) / 100;

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
    credit(userId, MONTHLY_TOKENS, `premium_grant:${plan}`);
    u.premiumLastGrant = now;
  }
  saveUser(u);
  audit({ userId, kind: "premium_activated", detail: `${plan} until ${new Date(u.premiumUntil).toISOString()}` });
}

/** Grants the monthly token allowance when due. Safe to call on every request. */
export function applyMonthlyGrant(userId: string, now = Date.now()) {
  const u = getUser(userId);
  if (!isPremium(u, now) || !u.premiumLastGrant || now - u.premiumLastGrant < MONTH) return;
  credit(userId, MONTHLY_TOKENS, "premium_grant:monthly");
  u.premiumLastGrant = now;
  saveUser(u);
}

/** Premium users chat for free up to the daily cap; after that chat costs tokens like everyone else. */
export function chatIsFree(userId: string, now = Date.now()): boolean {
  const u = getUser(userId);
  if (!isPremium(u, now)) return false;
  const since = now - DAY;
  const sent = db.messages.filter((m) => m.userId === userId && m.role === "user" && m.at > since).length;
  return sent < PREMIUM_DAILY_CHAT_CAP;
}
