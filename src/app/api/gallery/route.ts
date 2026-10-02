import type { NextRequest } from "next/server";
import { canView, listGallery } from "@/lib/gallery";
import { sessionUser } from "@/lib/auth";
import { json, SESSION_COOKIE } from "@/lib/http";

/** A model's gallery. Locked items carry no file address. */
export async function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get("c") ?? "";
  const unlocked = canView(sessionUser(req.cookies.get(SESSION_COOKIE)?.value));
  return json({ unlocked, items: listGallery(c).map((i) => ({ id: i.id, kind: i.kind, ...(unlocked ? { url: `/api/gallery/${i.id}` } : {}) })) });
}
