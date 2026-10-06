import type { NextRequest } from "next/server";
import { createSession, register, SESSION_DAYS } from "@/lib/auth";
import { clientIp } from "@/lib/trial";
import { attributeSignup } from "@/lib/referral";
import { body, errorResponse, json, setSessionCookie } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const b = await body<{ email: string; password: string; confirmAdultAndTerms: boolean; birthDate: string }>(req);
    const u = register(String(b.email ?? ""), String(b.password ?? ""), b.confirmAdultAndTerms === true, String(b.birthDate ?? ""), clientIp(req.headers));
    attributeSignup(u.id, req.cookies.get("fq_ref")?.value, req.cookies.get("fq_src")?.value);
    const res = json({ id: u.id, email: u.email }, 201);
    setSessionCookie(req, res, createSession(u.id), SESSION_DAYS);
    res.cookies.delete("fq_ref");
    return res;
  } catch (e) {
    return errorResponse(e);
  }
}
