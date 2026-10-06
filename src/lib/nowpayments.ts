import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentProvider } from "./payments";

// NOWPayments (crypto). Invoices are priced in USD; customers pick the coin on NOWPayments' page.
const API = "https://api.nowpayments.io/v1";
/** Rupees per US dollar used to price invoices (prices on the site are in INR). */
const inrPerUsd = () => Number(process.env.INR_PER_USD) || 85;
const siteUrl = () => (process.env.PUBLIC_URL ?? "https://flirtiq.online").replace(/\/$/, "");

export const toUsd = (inr: number) => Math.max(1, Math.round((inr / inrPerUsd()) * 100) / 100);

export function nowPayments(fetchImpl: typeof fetch = fetch): PaymentProvider {
  return {
    async createCheckout({ orderId, amount, currency, description }) {
      const key = process.env.NOWPAYMENTS_API_KEY;
      if (!key) throw new Error("NOWPAYMENTS_API_KEY is not set");
      const r = await fetchImpl(`${API}/invoice`, {
        method: "POST",
        headers: { "x-api-key": key, "content-type": "application/json" },
        body: JSON.stringify({
          price_amount: currency === "usd" ? amount : toUsd(amount),
          price_currency: "usd",
          order_id: orderId,
          order_description: `FlirtIQ ${description}`,
          ipn_callback_url: `${siteUrl()}/api/payments/nowpayments`,
          success_url: `${siteUrl()}/premium?paid=1`,
          cancel_url: `${siteUrl()}/premium`,
        }),
      });
      const b = (await r.json().catch(() => ({}))) as { invoice_url?: string; message?: string };
      if (!r.ok || !b.invoice_url) throw new Error(`NOWPayments: ${b.message ?? r.status}`);
      return { checkoutUrl: b.invoice_url };
    },
  };
}

/** Recursively sorts object keys, as NOWPayments does before signing. */
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]));
  return v;
}

/** Checks the x-nowpayments-sig header: HMAC-SHA512 of the key-sorted JSON body with the IPN secret. */
export function verifyIpn(body: unknown, signature: string | null, secret = process.env.NOWPAYMENTS_IPN_SECRET): boolean {
  if (!secret || !signature) return false;
  const expected = createHmac("sha512", secret).update(JSON.stringify(sortKeys(body))).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(signature.toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Only fully paid invoices unlock anything. */
export const isPaidStatus = (status: unknown) => status === "finished" || status === "confirmed";
