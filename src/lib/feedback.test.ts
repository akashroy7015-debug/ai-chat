import { describe, expect, it } from "vitest";
import { feedbackSummary, vote } from "./feedback";
import { beginVerification, completeVerification } from "./age/verification";
import { openConversation } from "./conversations";
import { db } from "./store";

describe("feedback", () => {
  it("votes on own character replies, toggles, and summarises without user text", async () => {
    await beginVerification("fb1"); await completeVerification("fb1");
    openConversation("fb1", "featured-3");
    const m = db.messages.filter((x) => x.userId === "fb1" && x.role === "assistant").at(-1)!;
    expect(vote("fb1", m.id, -1)).toBe(-1);
    const s = feedbackSummary();
    expect(s.perCharacter.find((p) => p.id === "featured-3")?.down).toBe(1);
    expect(s.recentDisliked[0].reply).toBe(m.content.slice(0, 240));
    expect(vote("fb1", m.id, -1)).toBe(0);
    expect(() => vote("someone-else", m.id, 1)).toThrow();
  });
});
