import { NextResponse } from "next/server";
import { voiceEnabled, voiceForMessage } from "@/lib/voice";
import { COSTS } from "@/lib/tokens/ledger";
import { authed, json } from "@/lib/http";

export const GET = authed(async (req, userId) => {
  const id = req.nextUrl.searchParams.get("messageId");
  if (!id) return json({ enabled: voiceEnabled(), cost: COSTS.voice });
  if (!voiceEnabled()) return json({ error: "Voice is coming soon." }, 503);
  const audio = await voiceForMessage(userId, id);
  return new NextResponse(audio, { headers: { "content-type": "audio/mpeg", "cache-control": "private, max-age=86400" } });
});
