import type { NextRequest } from "next/server";
import { createSession, register, SESSION_DAYS } from "@/lib/auth";
import { body, errorResponse, json, setSessionCookie } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const b = await body<{ email: string; password: string; confirmAdultAndTerms: boolean }>(req);
    const u = register(String(b.email ?? ""), String(b.password ?? ""), b.confirmAdultAndTerms === true);
    const res = json({ id: u.id, email: u.email }, 201);
    setSessionCookie(res, createSession(u.id), SESSION_DAYS);
    return res;
  } catch (e) {
    return errorResponse(e);
  }
}
