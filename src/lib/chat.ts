import { AccessDenied, explicitAllowed, requireVerifiedAdult } from "./age/verification";
import { COSTS, spend } from "./tokens/ledger";
import { detectSelfHarm, moderateText, SELF_HARM_RESPONSE } from "./moderation";
import { getLLM } from "./llm/provider";
import { openaiModerate } from "./llm/openai";
import { credit } from "./tokens/ledger";
import { applyMonthlyGrant, chatIsFree } from "./premium";
import { recall, remember } from "./memory";
import { canChatWith } from "./characters/schema";
import { ensureFeatured } from "./characters/featured";
import { audit, db, newId, saveUser, type Message } from "./store";

export const MAX_MESSAGE_LEN = 2000;
export const BAN_AT_STRIKES = 3;
const REFUSAL = "I can't go there, but I'm happy to keep talking about something else.";

export type ChatResult =
  | { kind: "reply"; message: string; tokensSpent: number }
  | { kind: "refused"; message: string; category: string }
  | { kind: "support"; message: string };

function push(m: Omit<Message, "id" | "at">) {
  db.messages.push({ id: newId(), at: Date.now(), ...m });
}

function supportReply(userId: string, characterId: string, message: string): ChatResult {
  push({ userId, characterId, role: "user", content: message });
  push({ userId, characterId, role: "assistant", content: SELF_HARM_RESPONSE });
  return { kind: "support", message: SELF_HARM_RESPONSE };
}

/**
 * Order matters: age gate -> ownership -> input moderation -> crisis routing ->
 * spend -> model -> output moderation. Tokens are only spent for delivered replies.
 */
export async function handleChat(userId: string, characterId: string, text: string): Promise<ChatResult> {
  const user = requireVerifiedAdult(userId);

  ensureFeatured();
  const character = db.characters.get(characterId);
  if (!character || !canChatWith(character, userId)) throw new AccessDenied("banned", "Character not found.", 404);

  const message = text.trim().slice(0, MAX_MESSAGE_LEN);
  if (!message) throw new AccessDenied("banned", "Empty message.", 400);

  const explicit = explicitAllowed(user);
  const verdict = moderateText(message, { explicitAllowed: explicit });
  if (!verdict.allowed) {
    // Explicit-content requests are refused without penalty; minor / real-person attempts earn strikes.
    audit({ userId, kind: "input_blocked", category: verdict.category, detail: message.slice(0, 200) });
    if (verdict.category === "minor" || verdict.category === "real_person") {
      user.strikes += 1;
      if (user.strikes >= BAN_AT_STRIKES) {
        user.banned = true;
        audit({ userId, kind: "auto_ban", category: verdict.category, detail: `strikes=${user.strikes}` });
      }
      saveUser(user);
    }
    return { kind: "refused", message: REFUSAL, category: verdict.category };
  }

  if (detectSelfHarm(message)) {
    audit({ userId, kind: "self_harm_routed", detail: "" });
    return supportReply(userId, characterId, message);
  }

  // Second moderation layer (OpenAI, free) when configured. Fails closed if the call errors.
  if (process.env.OPENAI_MODERATION === "true") {
    const cat = await openaiModerate(message, explicit).catch(() => "unavailable" as const);
    if (cat === "self_harm") return supportReply(userId, characterId, message);
    if (cat) {
      audit({ userId, kind: "input_blocked", category: `openai:${cat}`, detail: message.slice(0, 200) });
      return { kind: "refused", message: REFUSAL, category: cat };
    }
  }

  applyMonthlyGrant(userId);
  const free = chatIsFree(userId);
  if (!free) spend(userId, COSTS.chat, "chat");

  const history = db.messages
    .filter((m) => m.userId === userId && m.characterId === characterId)
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content }));

  let reply: string;
  try {
    reply = await getLLM().reply({ character, history, facts: recall(userId, characterId), userMessage: message, explicit });
  } catch (e) {
    if (!free) credit(userId, COSTS.chat, "refund:chat_error");
    audit({ userId, kind: "llm_error", detail: e instanceof Error ? e.message.slice(0, 200) : String(e) });
    return { kind: "refused", message: "I lost my train of thought, can you say that again? (No tokens were used.)", category: "error" };
  }

  const out = moderateText(reply, { explicitAllowed: explicit });
  if (!out.allowed) {
    audit({ userId, kind: "output_blocked", category: out.category, detail: reply.slice(0, 200) });
    return { kind: "refused", message: REFUSAL, category: out.category };
  }

  remember(userId, characterId, message);
  push({ userId, characterId, role: "user", content: message });
  push({ userId, characterId, role: "assistant", content: reply });
  return { kind: "reply", message: reply, tokensSpent: free ? 0 : COSTS.chat };
}
