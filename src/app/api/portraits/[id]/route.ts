import { NextResponse, type NextRequest } from "next/server";
import { readPortrait, resizedPortrait, userPortrait } from "@/lib/portraits";
import { authed, json } from "@/lib/http";

/** Portraits are SFW and public so the gallery can show them before signup. */
/** `?w=` picks a smaller WebP copy (made once, then cached on disk) so phones download far less. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const w = Number(req.nextUrl.searchParams.get("w"));
  const p = (w && (await resizedPortrait(id, w))) || readPortrait(id);
  if (!p) return new NextResponse(null, { status: 404 });
  const cache = req.nextUrl.searchParams.has("v") ? "public, max-age=31536000, immutable" : "public, max-age=86400, stale-while-revalidate=604800";
  return new NextResponse(new Uint8Array(p.data), { headers: { "content-type": p.type, "cache-control": cache } });
}

/** Generate a portrait for one of your own characters (costs tokens). */
export const POST = authed<{ id: string }>(async (_req, userId, { params }) => {
  await userPortrait(userId, (await params).id);
  return json({ ok: true });
});
