import { NextResponse, type NextRequest } from "next/server";
import { AccessDenied } from "./age/verification";
import { InsufficientTokens } from "./tokens/ledger";
import { newId } from "./store";

/**
 * DEV-ONLY identity: an anonymous cookie. Replace with real auth (email/social login)
 * before anything else is built on top; every route already takes a userId.
 */
export function userIdFrom(req: NextRequest): { userId: string; isNew: boolean } {
  const existing = req.cookies.get("uid")?.value;
  return existing ? { userId: existing, isNew: false } : { userId: newId(), isNew: true };
}

export function json(userId: { userId: string; isNew: boolean }, body: unknown, status = 200) {
  const res = NextResponse.json(body, { status });
  if (userId.isNew) res.cookies.set("uid", userId.userId, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}

export function errorResponse(id: { userId: string; isNew: boolean }, e: unknown) {
  if (e instanceof AccessDenied) return json(id, { error: e.message, code: e.code }, e.status);
  if (e instanceof InsufficientTokens) return json(id, { error: e.message, code: "insufficient_tokens", balance: e.balance }, 402);
  console.error(e);
  return json(id, { error: "Internal error" }, 500);
}
