import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { audit, db, getUser, newId, saveUser, type User } from "./store";
import { selfDeclareAge } from "./age/verification";
import { grantTrialOnce } from "./tokens/ledger";

export const SESSION_DAYS = 30;
const MIN_PASSWORD = 8;

export class AuthError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pw, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [alg, saltHex, hashHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(pw, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

const normEmail = (e: string) => e.trim().toLowerCase();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Linear scan is fine at MVP scale; add an email index when moving to Postgres. */
export function findByEmail(email: string): User | undefined {
  const e = normEmail(email);
  for (const u of db.users.values()) if (u.email === e) return u;
  return undefined;
}

/** Creates the account. With a birth date, the 18+ age gate is applied at once (see selfDeclareAge). */
export function register(email: string, password: string, confirmedAdultAndTerms: boolean, birthDate?: string): User {
  if (!confirmedAdultAndTerms) throw new AuthError("You must confirm you are 18+ and accept the Terms.");
  const e = normEmail(email);
  if (!EMAIL_RE.test(e) || e.length > 254) throw new AuthError("Enter a valid email.");
  if (password.length < MIN_PASSWORD || password.length > 200) throw new AuthError(`Password must be at least ${MIN_PASSWORD} characters.`);
  if (findByEmail(e)) throw new AuthError("An account with this email already exists.", 409);
  const u = getUser(newId());
  u.email = e;
  u.passwordHash = hashPassword(password);
  u.acceptedTermsAt = Date.now();
  saveUser(u);
  audit({ userId: u.id, kind: "registered", detail: "" });
  if (birthDate !== undefined) {
    selfDeclareAge(u.id, birthDate);
    grantTrialOnce(u.id);
  }
  return u;
}

// Simple in-memory brute-force limiter: 10 failed attempts per email per 15 minutes.
const failures = new Map<string, number[]>();
const WINDOW_MS = 15 * 60_000;
const MAX_FAILS = 10;

export function login(email: string, password: string): User {
  const e = normEmail(email);
  const now = Date.now();
  const recent = (failures.get(e) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_FAILS) throw new AuthError("Too many attempts. Try again later.", 429);
  const u = findByEmail(e);
  // Always run a hash so response time doesn't reveal whether the email exists.
  const ok = u?.passwordHash ? verifyPassword(password, u.passwordHash) : (verifyPassword(password, hashPassword("x")), false);
  if (!u || !ok) {
    failures.set(e, [...recent, now]);
    throw new AuthError("Wrong email or password.", 401);
  }
  failures.delete(e);
  if (u.banned) throw new AuthError("Account suspended.", 403);
  return u;
}

export function createSession(userId: string): string {
  const id = randomBytes(32).toString("base64url");
  db.sessions.set(id, { id, userId, expiresAt: Date.now() + SESSION_DAYS * 86_400_000 });
  return id;
}

export function sessionUser(sessionId: string | undefined): string | undefined {
  if (!sessionId) return undefined;
  const s = db.sessions.get(sessionId);
  if (!s) return undefined;
  if (s.expiresAt < Date.now()) {
    db.sessions.delete(sessionId);
    return undefined;
  }
  return s.userId;
}

export function destroySession(sessionId: string | undefined) {
  if (sessionId && db.sessions.has(sessionId)) db.sessions.delete(sessionId);
}

/** Free trial tokens are granted after ID verification, not at signup, so throwaway accounts can't farm them. */
export { grantTrialOnce };
