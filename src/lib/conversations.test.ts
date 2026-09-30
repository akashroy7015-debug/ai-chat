import { describe, expect, it } from "vitest";
import { listConversations, openConversation, PROACTIVE_AFTER_MS } from "./conversations";
import { beginVerification, completeVerification } from "./age/verification";
import { db } from "./store";

async function user(id: string) {
  await beginVerification(id);
  await completeVerification(id);
}

describe("conversations", () => {
  it("character greets first on a brand new chat, once", async () => {
    await user("cv1");
    const a = openConversation("cv1", "featured-1");
    expect(a).toHaveLength(1);
    expect(a[0].role).toBe("assistant");
    expect(openConversation("cv1", "featured-1")).toHaveLength(1);
  });

  it("reaches out after the user has been away", async () => {
    await user("cv2");
    openConversation("cv2", "featured-2");
    db.messages.push({ id: "u1", userId: "cv2", characterId: "featured-2", role: "user", content: "bye", at: Date.now() - PROACTIVE_AFTER_MS - 1000 });
    const t = openConversation("cv2", "featured-2");
    expect(t.at(-1)!.role).toBe("assistant");
    expect(t).toHaveLength(3);
  });

  it("requires verification and lists chats newest first", async () => {
    expect(() => openConversation("cv-unv", "featured-1")).toThrow();
    await user("cv3");
    openConversation("cv3", "featured-1");
    openConversation("cv3", "featured-3");
    const list = listConversations("cv3");
    expect(list.map((x) => x!.character.id)).toEqual(expect.arrayContaining(["featured-1", "featured-3"]));
  });
});
