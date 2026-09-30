import { describe, expect, it, vi } from "vitest";
import { ttsVoice, voiceForMessage } from "./voice";
import { beginVerification, completeVerification } from "./age/verification";
import { balance, credit, COSTS } from "./tokens/ledger";
import { openConversation } from "./conversations";
import { db } from "./store";

async function setup(id: string) {
  await beginVerification(id);
  await completeVerification(id);
  credit(id, 20, "test");
  openConversation(id, "featured-1");
  return db.messages.filter((m) => m.userId === id).at(-1)!;
}

describe("voice", () => {
  it("maps voices by gender", () => {
    expect(ttsVoice({ gender: "male", voice: "deep" })).toBe("onyx");
    expect(ttsVoice({ gender: "female", voice: "soft" })).toBe("shimmer");
  });
  it("charges once, replays free", async () => {
    const m = await setup("v1");
    const tts = { speak: vi.fn(async () => new ArrayBuffer(4)) };
    await voiceForMessage("v1", m.id, tts);
    await voiceForMessage("v1", m.id, tts);
    expect(tts.speak).toHaveBeenCalledTimes(1);
    expect(balance("v1")).toBe(20 - COSTS.voice);
  });
  it("refunds on failure", async () => {
    const m = await setup("v2");
    await expect(voiceForMessage("v2", m.id, { speak: async () => { throw new Error("x"); } })).rejects.toThrow();
    expect(balance("v2")).toBe(20);
  });
  it("only the owner's assistant messages", async () => {
    const m = await setup("v3");
    await setup("v4");
    await expect(voiceForMessage("v4", m.id, { speak: async () => new ArrayBuffer(1) })).rejects.toThrow("not found");
  });
});
