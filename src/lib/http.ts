import { NextResponse, type NextRequest } from "next/server";
import { AccessDenied } from "./age/verification";
import { AuthError, sessionUser } from "./auth";
import { InsufficientTokens } from "./tokens/ledger";
import { countryFromHeaders } from "./jurisdiction";
import { getUser } from "./store";

export const SESSION_COOKIE = "sid";

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

/** Resolves the logged-in user or throws 401. Also refreshes the request country (not persisted). */
export function currentUser(req: NextRequest): string {
  const userId = sessionUser(req.cookies.get(SESSION_COOKIE)?.value);
  if (!userId) throw new AccessDenied("login_required", "Please log in.", 401);
  getUser(userId).lastCountry = countryFromHeaders(req.headers) ?? process.env.DEV_COUNTRY;
  return userId;
}

export function errorResponse(e: unknown) {
  if (e instanceof AccessDenied) return json({ error: e.message, code: e.code }, e.status);
  if (e instanceof AuthError) return json({ error: e.message }, e.status);
  if (e instanceof InsufficientTokens) return json({ error: e.message, code: "insufficient_tokens", balance: e.balance }, 402);
  console.error(e);
  return json({ error: "Internal error" }, 500);
}

type Ctx<P> = { params: Promise<P> };

/** Route wrapper: requires login and turns known errors into JSON responses. */
export function authed<P = Record<string, never>>(fn: (req: NextRequest, userId: string, ctx: Ctx<P>) => Promise<Response>) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      return await fn(req, currentUser(req), ctx);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export async function body<T>(req: NextRequest): Promise<Partial<T>> {
  return ((await req.json().catch(() => ({}))) ?? {}) as Partial<T>;
}

export function setSessionCookie(res: NextResponse, sid: string, maxAgeDays: number) {
  res.cookies.set(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeDays * 86_400,
  });
}
