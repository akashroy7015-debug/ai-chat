import { AccessDenied, requireVerifiedAdult } from "./age/verification";
import { isAdmin } from "./admin";
import { credit } from "./tokens/ledger";
import { audit, db, getUser, newId } from "./store";
import { activatePlan, isPremium, PLANS, type PlanId } from "./premium";

/** Pay-as-you-go credit packs (rupees, GST included). Only Premium members can buy them. */
export const PACKAGES = {
  starter: { tokens: 300, priceInr: 149, label: "300 credits" },
  popular: { tokens: 1000, priceInr: 449, label: "1,000 credits" },
  premium: { tokens: 2500, priceInr: 999, label: "2,500 credits" },
} as const;
export type PackageId = keyof typeof PACKAGES;

/** Implement with a processor that accepts adult merchants (not Stripe/PayPal). */
export interface PaymentProvider {
  createCheckout(args: { orderId: string; userId: string; amountInr: number; description: string }): Promise<{ checkoutUrl: string }>;
}


export const mockPayments: PaymentProvider = {
  async createCheckout({ orderId }) {
    return { checkoutUrl: `/checkout/mock?order=${orderId}` };
  },
};

export function getPayments(): PaymentProvider {
  const p = process.env.PAYMENT_PROVIDER ?? "mock";
  if (p === "mock") {
    if (process.env.NODE_ENV === "production" && !process.env.PAYMENT_PROVIDER) throw new Error("PAYMENT_PROVIDER must be configured in production");
    return mockPayments;
  }
  throw new Error(`Unknown PAYMENT_PROVIDER: ${p}`);
}

/**
 * True when this user can actually pay. The mock provider (no real gateway yet) only works in
 * development or for admins, so nobody gets Premium or credits for free on the live site.
 */
export function paymentsLive(userId: string): boolean {
  const p = process.env.PAYMENT_PROVIDER ?? "mock";
  if (p !== "mock") return true;
  return process.env.NODE_ENV !== "production" || isAdmin(userId);
}

function requirePaymentsLive(userId: string) {
  if (!paymentsLive(userId)) throw new AccessDenied("payments_unavailable", "Payments are launching very soon. Check back shortly!", 503);
}

/** Credit packs: ID-verified adults with an active Premium membership. */
export async function startCheckout(userId: string, pkg: PackageId) {
  requireVerifiedAdult(userId);
  const p = PACKAGES[pkg];
  if (!p) throw new Error("Unknown package");
  if (!isPremium(getUser(userId))) throw new AccessDenied("premium_required", "Credit packs are for Premium members. Get Premium first.");
  requirePaymentsLive(userId);
  const orderId = newId();
  db.orders.set(orderId, { id: orderId, userId, pkg, paid: false });
  audit({ userId, kind: "checkout_started", detail: `${pkg} ${orderId}` });
  return { orderId, ...(await getPayments().createCheckout({ orderId, userId, amountInr: p.priceInr, description: p.label })) };
}

/** Premium purchase (one-time, no auto-renewal). Only age-verified adults. */
export async function startSubscription(userId: string, plan: PlanId) {
  requireVerifiedAdult(userId);
  const p = PLANS[plan];
  if (!p) throw new Error("Unknown plan");
  requirePaymentsLive(userId);
  const orderId = newId();
  db.orders.set(orderId, { id: orderId, userId, pkg: `sub:${plan}`, paid: false });
  audit({ userId, kind: "checkout_started", detail: `sub:${plan} ${orderId}` });
  return { orderId, ...(await getPayments().createCheckout({ orderId, userId, amountInr: p.priceInr, description: `Premium ${p.label}` })) };
}

/** Called from the processor's signed webhook. Idempotent. */
export function fulfilOrder(orderId: string) {
  const o = db.orders.get(orderId);
  if (!o) throw new Error("Unknown order");
  if (o.paid) return;
  o.paid = true;
  db.orders.save(orderId);
  if (o.pkg.startsWith("sub:")) activatePlan(o.userId, o.pkg.slice(4) as PlanId);
  else credit(o.userId, PACKAGES[o.pkg as PackageId].tokens, `purchase:${orderId}`);
  audit({ userId: o.userId, kind: "order_paid", detail: orderId });
}
