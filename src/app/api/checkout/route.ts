import type { NextRequest } from "next/server";
import { fulfilOrder, PACKAGES, startCheckout, type PackageId } from "@/lib/payments";
import { errorResponse, json, userIdFrom } from "@/lib/http";

export async function GET(req: NextRequest) {
  return json(userIdFrom(req), { packages: PACKAGES });
}

export async function POST(req: NextRequest) {
  const id = userIdFrom(req);
  try {
    const { pkg } = (await req.json().catch(() => ({}))) as { pkg?: string };
    if (!pkg || !(pkg in PACKAGES)) return json(id, { error: "Unknown package" }, 400);
    const r = await startCheckout(id.userId, pkg as PackageId);
    // Dev mock only: pay instantly. Real processors fulfil via their signed webhook.
    if ((process.env.PAYMENT_PROVIDER ?? "mock") === "mock") fulfilOrder(r.orderId);
    return json(id, r);
  } catch (e) {
    return errorResponse(id, e);
  }
}
