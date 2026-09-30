import { describe, expect, it } from "vitest";
import { fulfilOrder, PACKAGES, startCheckout } from "./payments";
import { beginVerification, completeVerification } from "./age/verification";
import { balance } from "./tokens/ledger";

describe("payments", () => {
  it("refuses unverified buyers", async () => {
    await expect(startCheckout("p-unv", "starter")).rejects.toThrow("Age verification required");
  });
  it("credits once per order", async () => {
    await beginVerification("p1");
    await completeVerification("p1");
    const { orderId } = await startCheckout("p1", "popular");
    fulfilOrder(orderId);
    fulfilOrder(orderId);
    expect(balance("p1")).toBe(PACKAGES.popular.tokens);
  });
});
