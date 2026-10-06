import { fulfilOrder, PACKAGES, startCheckout, type PackageId } from "@/lib/payments";
import { authed, body, json } from "@/lib/http";

export async function GET() {
  return json({ packages: PACKAGES });
}

export const POST = authed(async (req, userId) => {
  const { pkg, currency } = await body<{ pkg: string; currency: string }>(req);
  if (!pkg || !(pkg in PACKAGES)) return json({ error: "Unknown package" }, 400);
  const r = await startCheckout(userId, pkg as PackageId, currency === "usd" ? "usd" : "inr");
  // Dev mock only: pay instantly. Real processors fulfil via their signed webhook.
  if ((process.env.PAYMENT_PROVIDER ?? "mock") === "mock") fulfilOrder(r.orderId);
  return json(r);
});
