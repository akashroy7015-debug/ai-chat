import { describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { isPaidStatus, nowPayments, toUsd, verifyIpn } from "./nowpayments";

describe("NOWPayments", () => {
  it("accepts only correctly signed notifications", () => {
    const body = { payment_status: "finished", order_id: "o1", amount: { b: 2, a: 1 } };
    const sig = createHmac("sha512", "s3cret").update(JSON.stringify({ amount: { a: 1, b: 2 }, order_id: "o1", payment_status: "finished" })).digest("hex");
    expect(verifyIpn(body, sig, "s3cret")).toBe(true);
    expect(verifyIpn({ ...body, order_id: "o2" }, sig, "s3cret")).toBe(false);
    expect(verifyIpn(body, sig, undefined)).toBe(false);
    expect(verifyIpn(body, null, "s3cret")).toBe(false);
  });
  it("only fully paid statuses unlock", () => {
    expect(isPaidStatus("finished")).toBe(true);
    expect(isPaidStatus("partially_paid")).toBe(false);
    expect(isPaidStatus("waiting")).toBe(false);
  });
  it("creates an invoice priced in USD and returns its page", async () => {
    process.env.NOWPAYMENTS_API_KEY = "k";
    const f = vi.fn(async () => new Response(JSON.stringify({ invoice_url: "https://nowpayments.io/payment/?iid=1" }), { status: 200 }));
    const r = await nowPayments(f as unknown as typeof fetch).createCheckout({ orderId: "o1", userId: "u", amountInr: 999, description: "Premium" });
    expect(r.checkoutUrl).toContain("nowpayments.io");
    const sent = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(sent).toMatchObject({ price_currency: "usd", order_id: "o1", price_amount: toUsd(999) });
  });
});
