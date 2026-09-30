import type { NextRequest } from "next/server";
import { destroySession } from "@/lib/auth";
import { json, SESSION_COOKIE, setSessionCookie } from "@/lib/http";

export async function POST(req: NextRequest) {
  destroySession(req.cookies.get(SESSION_COOKIE)?.value);
  const res = json({ ok: true });
  setSessionCookie(res, "", 0);
  return res;
}
