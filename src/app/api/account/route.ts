import { applyMonthlyGrant, isPremium, MONTH, PLANS, type PlanId } from "@/lib/premium";
import { orderInfo } from "@/lib/payments";
import { balance } from "@/lib/tokens/ledger";
import { db, getUser } from "@/lib/store";
import { authed, json } from "@/lib/http";
import { referralStats } from "@/lib/referral";

const DAY = 86_400_000;

/** Membership, credits and purchase history for the signed-in user. */
export const GET = authed(async (_req, userId) => {
  applyMonthlyGrant(userId);
  const u = getUser(userId);
  const now = Date.now();
  const premium = isPremium(u, now);
  const plan = u.premiumPlan as PlanId | undefined;
  const orders = [...db.orders.values()]
    .filter((o) => o.userId === userId && (o.paid || now - (o.createdAt ?? 0) < 7 * DAY))
    .sort((a, b) => (b.paidAt ?? b.createdAt ?? 0) - (a.paidAt ?? a.createdAt ?? 0))
    .slice(0, 20)
    .map((o) => ({ id: o.id.slice(0, 8), ...orderInfo(o.pkg, o.currency ?? "inr"), status: o.paid ? "paid" : "pending", at: o.paidAt ?? o.createdAt ?? null }));
  const credits = db.ledger
    .filter((e) => e.userId === userId && e.delta > 0)
    .slice(-10)
    .reverse()
    .map((e) => ({ amount: e.delta, reason: e.reason.split(":")[0], at: e.at }));
  return json({
    email: u.email,
    premium,
    plan: plan && PLANS[plan] ? PLANS[plan].label : null,
    monthlyCredits: plan && PLANS[plan] ? PLANS[plan].credits : null,
    premiumUntil: u.premiumUntil ?? null,
    daysLeft: premium ? Math.ceil((u.premiumUntil! - now) / DAY) : 0,
    nextCreditsAt: premium && u.premiumLastGrant && u.premiumLastGrant + MONTH < u.premiumUntil! ? u.premiumLastGrant + MONTH : null,
    balance: balance(userId),
    orders,
    credits,
    referral: referralStats(userId),
  });
});
