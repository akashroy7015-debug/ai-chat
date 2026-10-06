import type { NextRequest } from "next/server";
import { GuestLimit, guestLeft, guestReply, publicCharacter } from "@/lib/guest";
import { clientIp } from "@/lib/trial";
import { body, json } from "@/lib/http";
import type { ChatTurn } from "@/lib/llm/provider";

/** Public card for a featured character plus how many preview messages are left. */
export async function GET(req: NextRequest) {
  const c = publicCharacter(req.nextUrl.searchParams.get("c") ?? "");
  if (!c) return json({ error: "Character not found" }, 404);
  return json({ character: c, left: guestLeft(clientIp(req.headers)) });
}

/** A preview reply for visitors without an account (age-confirmed in the browser first). */
export async function POST(req: NextRequest) {
  const b = await body<{ characterId: string; message: string; history: ChatTurn[]; adult: boolean }>(req);
  if (b.adult !== true) return json({ error: "Please confirm you are 18 or older." }, 403);
  try {
    return json(await guestReply(clientIp(req.headers), String(b.characterId ?? ""), String(b.message ?? ""), Array.isArray(b.history) ? b.history : []));
  } catch (e) {
    if (e instanceof GuestLimit) return json({ error: e.message, code: "signup_required" }, 402);
    return json({ error: e instanceof Error ? e.message : "Error" }, 400);
  }
}
