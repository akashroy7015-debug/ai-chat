import { requireVerifiedAdult } from "./age/verification";
import { credit } from "./tokens/ledger";
import { audit, db, newId } from "./store";
import { activatePlan, PLANS, type PlanId } from "./premium";

export const PACKAGES = {
  starter: { tokens: 100, priceUsd: 9.99, label: "100 tokens" },
  popular: { tokens: 300, priceUsd: 24.99, label: "300 tokens" },
  premium: { tokens: 1000, priceUsd: 69.99, label: "1000 tokens" },
} as const;
export type PackageId = keyof typeof PACKAGES;

/** Implement with a processor that accepts adult merchants (not Stripe/PayPal). */
export interface PaymentProvider {
  createCheckout(args: { orderId: string; userId: string; amountUsd: number; description: string }): Promise<{ checkoutUrl: string }>;
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

/** Only ID-verified adults can buy. */
export async function startCheckout(userId: string, pkg: PackageId) {
  requireVerifiedAdult(userId);
  const p = PACKAGES[pkg];
  if (!p) throw new Error("Unknown package");
  const orderId = newId();
  db.orders.set(orderId, { id: orderId, userId, pkg, paid: false });
  audit({ userId, kind: "checkout_started", detail: `${pkg} ${orderId}` });
  return { orderId, ...(await getPayments().createCheckout({ orderId, userId, amountUsd: p.priceUsd, description: p.label })) };
}

/** Subscription purchase. Only ID-verified adults can subscribe. */
export async function startSubscription(userId: string, plan: PlanId) {
  requireVerifiedAdult(userId);
  const p = PLANS[plan];
  if (!p) throw new Error("Unknown plan");
  const orderId = newId();
  db.orders.set(orderId, { id: orderId, userId, pkg: `sub:${plan}`, paid: false });
  audit({ userId, kind: "checkout_started", detail: `sub:${plan} ${orderId}` });
  return { orderId, ...(await getPayments().createCheckout({ orderId, userId, amountUsd: p.priceUsd, description: `Premium ${p.label}` })) };
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
