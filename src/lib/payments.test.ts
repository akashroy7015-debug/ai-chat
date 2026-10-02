import { describe, expect, it } from "vitest";
import { fulfilOrder, PACKAGES, startCheckout, startSubscription } from "./payments";
import { selfDeclareAge } from "./age/verification";
import { activatePlan, MONTHLY_TOKENS } from "./premium";
import { balance } from "./tokens/ledger";

describe("payments", () => {
  it("refuses unverified buyers", async () => {
    await expect(startCheckout("p-unv", "starter")).rejects.toThrow("Age verification required");
  });
  it("credit packs need Premium", async () => {
    selfDeclareAge("p0", "1990-01-01");
    await expect(startCheckout("p0", "starter")).rejects.toThrow("Premium members");
  });
  it("Premium grants monthly credits; packs add pay-as-you-go credits once per order", async () => {
    selfDeclareAge("p1", "1990-01-01");
    const sub = await startSubscription("p1", "monthly");
    fulfilOrder(sub.orderId);
    expect(balance("p1")).toBe(MONTHLY_TOKENS);
    const { orderId } = await startCheckout("p1", "popular");
    fulfilOrder(orderId);
    fulfilOrder(orderId);
    expect(balance("p1")).toBe(MONTHLY_TOKENS + PACKAGES.popular.tokens);
  });
  it("blocks free purchases on the live site until a real gateway is set up", async () => {
    const env = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "production";
    try {
      selfDeclareAge("p2", "1990-01-01");
      activatePlan("p2", "monthly");
      await expect(startSubscription("p2", "monthly")).rejects.toThrow("launching");
      await expect(startCheckout("p2", "starter")).rejects.toThrow("launching");
    } finally {
      (process.env as Record<string, string>).NODE_ENV = env!;
    }
  });
});
