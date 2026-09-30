import { fulfilOrder, startSubscription } from "@/lib/payments";
import { isPremium, MONTHLY_TOKENS, perMonth, PLANS, planDiscountPct, PREMIUM_DAILY_CHAT_CAP, type PlanId } from "@/lib/premium";
import { getUser } from "@/lib/store";
import { authed, body, json } from "@/lib/http";

export async function GET() {
  const plans = (Object.keys(PLANS) as PlanId[]).map((id) => ({ id, ...PLANS[id], perMonth: perMonth(id), discountPct: planDiscountPct(id) }));
  return json({ plans, monthlyTokens: MONTHLY_TOKENS, dailyChatCap: PREMIUM_DAILY_CHAT_CAP });
}

export const POST = authed(async (req, userId) => {
  const { plan } = await body<{ plan: string }>(req);
  if (!plan || !(plan in PLANS)) return json({ error: "Unknown plan" }, 400);
  const r = await startSubscription(userId, plan as PlanId);
  // Dev mock only: pay instantly. Real processors fulfil via their signed webhook.
  if ((process.env.PAYMENT_PROVIDER ?? "mock") === "mock") fulfilOrder(r.orderId);
  const u = getUser(userId);
  return json({ ...r, premium: isPremium(u), premiumUntil: u.premiumUntil });
});
