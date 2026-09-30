import type { NextRequest } from "next/server";
import { createSession, login, SESSION_DAYS } from "@/lib/auth";
import { body, errorResponse, json, setSessionCookie } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const b = await body<{ email: string; password: string }>(req);
    const u = login(String(b.email ?? ""), String(b.password ?? ""));
    const res = json({ id: u.id, email: u.email });
    setSessionCookie(res, createSession(u.id), SESSION_DAYS);
    return res;
  } catch (e) {
    return errorResponse(e);
  }
}
