import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { readPending } from "@/lib/portraits";
import { authed } from "@/lib/http";

/** Pending pictures are visible to admins only. */
export const GET = authed<{ id: string }>(async (_req, userId, { params }) => {
  requireAdmin(userId);
  const p = readPending((await params).id);
  if (!p) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(p.data), { headers: { "content-type": p.type, "cache-control": "no-store" } });
});
