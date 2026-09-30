import type { Character } from "./characters/schema";
import { requireVerifiedAdult, AccessDenied } from "./age/verification";
import { COSTS, credit, spend } from "./tokens/ledger";
import { audit, db } from "./store";

/** Character voice setting -> OpenAI TTS voice. */
const FEMALE: Record<string, string> = { soft: "shimmer", warm: "nova", playful: "coral", deep: "alloy", confident: "sage", husky: "ballad" };
const MALE: Record<string, string> = { soft: "fable", warm: "echo", playful: "ash", deep: "onyx", confident: "ash", husky: "onyx" };

export function ttsVoice(c: Pick<Character, "gender" | "voice">): string {
  return (c.gender === "male" ? MALE : FEMALE)[c.voice] ?? (c.gender === "male" ? "echo" : "nova");
}

export interface TTS {
  speak(text: string, voice: string): Promise<ArrayBuffer>;
}

export const openaiTTS: TTS = {
  async speak(text, voice) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not set");
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: process.env.OPENAI_TTS_MODEL ?? "tts-1", voice, input: text.slice(0, 1000), response_format: "mp3" }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`OpenAI TTS ${res.status}`);
    return res.arrayBuffer();
  },
};

export const voiceEnabled = () => process.env.LLM_PROVIDER === "openai" && !!process.env.OPENAI_API_KEY;

// Replaying a message you already paid for is free (small in-memory cache).
const cache = new Map<string, ArrayBuffer>();
const CACHE_MAX = 200;

/** Speaks one of the character's own messages in this user's thread. Charges on success only. */
export async function voiceForMessage(userId: string, messageId: string, tts: TTS = openaiTTS): Promise<ArrayBuffer> {
  requireVerifiedAdult(userId);
  const msg = db.messages.find((m) => m.id === messageId);
  if (!msg || msg.userId !== userId || msg.role !== "assistant") throw new AccessDenied("banned", "Message not found.", 404);
  const key = `${userId}:${messageId}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const c = db.characters.get(msg.characterId);
  if (!c) throw new AccessDenied("banned", "Character not found.", 404);
  spend(userId, COSTS.voice, "voice");
  try {
    const audio = await tts.speak(msg.content, ttsVoice(c));
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
    cache.set(key, audio);
    return audio;
  } catch (e) {
    credit(userId, COSTS.voice, "refund:voice_error");
    audit({ userId, kind: "voice_error", detail: e instanceof Error ? e.message : String(e) });
    throw new AccessDenied("banned", "Voice is unavailable right now. No tokens were used.", 503);
  }
}
