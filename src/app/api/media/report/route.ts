import type { NextRequest } from "next/server";
import { reportMedia } from "@/lib/media/jobs";
import { errorResponse, json, userIdFrom } from "@/lib/http";

export async function POST(req: NextRequest) {
  const id = userIdFrom(req);
  try {
    const b = (await req.json().catch(() => ({}))) as { id?: string; reason?: string };
    if (typeof b.id !== "string") return json(id, { error: "id required" }, 400);
    reportMedia(id.userId, b.id, b.reason ?? "");
    return json(id, { ok: true });
  } catch (e) {
    return errorResponse(id, e);
  }
}
