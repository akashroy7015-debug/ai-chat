import type { NextRequest } from "next/server";
import { isPaidStatus, verifyIpn } from "@/lib/nowpayments";
import { fulfilOrder } from "@/lib/payments";
import { audit, db } from "@/lib/store";
import { json } from "@/lib/http";

/** NOWPayments payment notifications (IPN). Signed; fulfils the order once it is paid. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { order_id?: string; payment_status?: string; payment_id?: number } | null;
  if (!body || !verifyIpn(body, req.headers.get("x-nowpayments-sig"))) return json({ error: "bad signature" }, 401);
  const orderId = String(body.order_id ?? "");
  if (!db.orders.get(orderId)) return json({ error: "unknown order" }, 404);
  audit({ userId: db.orders.get(orderId)!.userId, kind: "payment_ipn", detail: `${orderId} ${body.payment_status} ${body.payment_id ?? ""}` });
  if (isPaidStatus(body.payment_status)) fulfilOrder(orderId);
  return json({ ok: true });
}
