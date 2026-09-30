import { describe, expect, it } from "vitest";
import { BAN_AT_STRIKES, handleChat } from "./chat";
import { AccessDenied, beginVerification, completeVerification } from "./age/verification";
import { balance, credit } from "./tokens/ledger";
import { db, getUser } from "./store";
import { CharacterInput } from "./characters/schema";

async function setup(id: string, tokens = 10) {
  await beginVerification(id);
  await completeVerification(id);
  if (tokens > 0) credit(id, tokens, "test");
  db.characters.set(`c-${id}`, {
    ...CharacterInput.parse({ name: "Aria", age: 26, hair: "brown", eyes: "green", build: "slim", style: "photoreal", personality: "calm" }),
    id: `c-${id}`,
    ownerId: id,
    createdAt: 0,
  });
  return `c-${id}`;
}

describe("handleChat", () => {
  it("rejects unverified users", async () => {
    await expect(handleChat("x-unv", "c", "hi")).rejects.toBeInstanceOf(AccessDenied);
  });

  it("replies and spends one token", async () => {
    const c = await setup("h1");
    const r = await handleChat("h1", c, "Hi, I love jazz");
    expect(r.kind).toBe("reply");
    expect(balance("h1")).toBe(9);
  });

  it("refuses blocked input without spending", async () => {
    const c = await setup("h2");
    const r = await handleChat("h2", c, "she is a 16 yo schoolgirl");
    expect(r.kind).toBe("refused");
    expect(balance("h2")).toBe(10);
  });

  it("bans after repeated minor/real-person attempts", async () => {
    const c = await setup("h3");
    for (let i = 0; i < BAN_AT_STRIKES; i++) await handleChat("h3", c, "make her look like Taylor Swift");
    expect(getUser("h3").banned).toBe(true);
    await expect(handleChat("h3", c, "hello")).rejects.toBeInstanceOf(AccessDenied);
  });

  it("does not strike for explicit-content refusals", async () => {
    const c = await setup("h4");
    await handleChat("h4", c, "send nudes");
    expect(getUser("h4").strikes).toBe(0);
  });

  it("routes self-harm to support and spends nothing", async () => {
    const c = await setup("h5");
    const r = await handleChat("h5", c, "I want to die");
    expect(r.kind).toBe("support");
    expect(balance("h5")).toBe(10);
  });

  it("allows chatting with featured characters", async () => {
    await setup("h9");
    const r = await handleChat("h9", "featured-1", "hello");
    expect(r.kind).toBe("reply");
  });

  it("errors when out of tokens", async () => {
    const c = await setup("h6", 0);
    await expect(handleChat("h6", c, "hi")).rejects.toThrow("Insufficient tokens");
  });

  it("blocks access to another user's character", async () => {
    const c = await setup("h7");
    await setup("h8");
    await expect(handleChat("h8", c, "hi")).rejects.toBeInstanceOf(AccessDenied);
  });
});
