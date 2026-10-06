import { describe, expect, it } from "vitest";
import { GUEST_MESSAGES, GuestLimit, guestLeft, guestReply } from "./guest";
import { listFeatured } from "./characters/featured";

describe("guest preview chat", () => {
  it("allows a few messages per network per day, then asks to sign up", async () => {
    const c = listFeatured()[0];
    expect(guestLeft("7.7.7.7")).toBe(GUEST_MESSAGES);
    for (let i = 0; i < GUEST_MESSAGES; i++) {
      const r = await guestReply("7.7.7.7", c.id, "hi there", []);
      expect(typeof r.message).toBe("string");
    }
    expect(guestLeft("7.7.7.7")).toBe(0);
    await expect(guestReply("7.7.7.7", c.id, "hi", [])).rejects.toBeInstanceOf(GuestLimit);
    await expect(guestReply(undefined, c.id, "hi", [])).rejects.toBeInstanceOf(GuestLimit);
  });
});
