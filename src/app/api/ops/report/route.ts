import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { opsReport } from "@/lib/ops";

/** For the maintenance agent: Authorization: Bearer <OPS_TOKEN>. Disabled unless OPS_TOKEN is set (24+ chars). */
export async function GET(req: NextRequest) {
  const token = process.env.OPS_TOKEN ?? "";
  const given = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const ok = token.length >= 24 && given.length === token.length && timingSafeEqual(Buffer.from(given), Buffer.from(token));
  if (!ok) return new NextResponse(null, { status: 404 });
  return NextResponse.json(opsReport());
}
