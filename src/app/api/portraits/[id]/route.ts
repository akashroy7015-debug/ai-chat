import { NextResponse, type NextRequest } from "next/server";
import { readPortrait, userPortrait } from "@/lib/portraits";
import { authed, json } from "@/lib/http";

/** Portraits are SFW and public so the gallery can show them before signup. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = readPortrait((await params).id);
  if (!p) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(p.data), {
    headers: { "content-type": p.type, "cache-control": "public, max-age=3600" },
  });
}

/** Generate a portrait for one of your own characters (costs tokens). */
export const POST = authed<{ id: string }>(async (_req, userId, { params }) => {
  await userPortrait(userId, (await params).id);
  return json({ ok: true });
});
