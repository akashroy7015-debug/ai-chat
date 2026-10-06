import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { startCheckout, startSubscription } from "@/lib/payments";
import { selfDeclareAge } from "@/lib/age/verification";
import { isPremium, PLANS } from "@/lib/premium";
import { balance } from "@/lib/tokens/ledger";
import { getUser } from "@/lib/store";

const SECRET = "ipn-test";
function ipn(body: object, secret = SECRET) {
  const sorted = JSON.stringify(Object.fromEntries(Object.keys(body).sort().map((k) => [k, (body as Record<string, unknown>)[k]])));
  const sig = createHmac("sha512", secret).update(sorted).digest("hex");
  return new NextRequest("https://flirtiq.online/api/payments/nowpayments", { method: "POST", body: JSON.stringify(body), headers: { "x-nowpayments-sig": sig } });
}

describe("payment → Premium and credits, end to end", () => {
  it("activates Premium with credits, then a top-up adds credits; fake or unpaid notices do nothing", async () => {
    process.env.NOWPAYMENTS_IPN_SECRET = SECRET;
    selfDeclareAge("buyer", "1990-01-01");
    const sub = await startSubscription("buyer", "monthly");

    expect((await POST(ipn({ order_id: sub.orderId, payment_status: "waiting" }))).status).toBe(200);
    expect(isPremium(getUser("buyer"))).toBe(false);
    expect((await POST(ipn({ order_id: sub.orderId, payment_status: "finished" }, "wrong"))).status).toBe(401);
    expect(isPremium(getUser("buyer"))).toBe(false);

    await POST(ipn({ order_id: sub.orderId, payment_status: "finished" }));
    await POST(ipn({ order_id: sub.orderId, payment_status: "finished" })); // duplicate notice
    expect(isPremium(getUser("buyer"))).toBe(true);
    expect(balance("buyer")).toBe(PLANS.monthly.credits);

    const pack = await startCheckout("buyer", "starter");
    await POST(ipn({ order_id: pack.orderId, payment_status: "finished" }));
    expect(balance("buyer")).toBe(PLANS.monthly.credits + 300);
  });
});
