import { randomBytes } from "node:crypto";
import { credit } from "./tokens/ledger";
import { audit, db, getUser, PMap, saveUser } from "./store";

/** Credits given to both people when an invited friend signs up. */
export const REFERRAL_BONUS = 20;
/** At most this many paid-out invites per inviter per 30 days (stops farming). */
export const MAX_REWARDS_PER_MONTH = 25;
const MONTH = 30 * 86_400_000;

const g = globalThis as unknown as { __refcodes?: PMap<{ userId: string }> };
const codes: PMap<{ userId: string }> = (g.__refcodes ??= new PMap(db.sql, "referral_codes"));

/** The user's invite code, created on first use. */
export function referralCode(userId: string): string {
  const u = getUser(userId);
  if (u.referralCode) return u.referralCode;
  let code: string;
  do code = randomBytes(4).toString("base64url").replace(/[-_]/g, "").slice(0, 6).toLowerCase();
  while (code.length < 6 || codes.get(code));
  codes.set(code, { userId });
  u.referralCode = code;
  saveUser(u);
  return code;
}

export const userForCode = (code: string | undefined) => (code ? codes.get(code.trim().toLowerCase())?.userId : undefined);

/** Cleans a source label from the cookie (letters, digits, dots, dashes; max 40 chars). */
const cleanSource = (s: string | undefined) => (s ?? "").toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40) || undefined;

/**
 * Records where a new user came from and rewards the inviter.
 * Rewards are only paid when the new account received the free trial (so throwaway or repeat
 * accounts that were denied a trial never earn the inviter credits).
 */
export function attributeSignup(newUserId: string, ref: string | undefined, source: string | undefined, now = Date.now()) {
  const u = getUser(newUserId);
  const inviter = userForCode(ref);
  u.signupSource = inviter ? "invite" : cleanSource(source) ?? "direct";
  if (!inviter || inviter === newUserId) { saveUser(u); return; }
  u.referredBy = inviter;
  saveUser(u);
  const gotTrial = db.ledger.some((e) => e.userId === newUserId && e.reason === "free_trial");
  const recent = db.ledger.filter((e) => e.userId === inviter && e.reason === "referral" && now - e.at < MONTH).length;
  if (!gotTrial || recent >= MAX_REWARDS_PER_MONTH) {
    audit({ userId: inviter, kind: "referral_not_rewarded", detail: gotTrial ? "monthly cap" : "invitee had no trial" });
    return;
  }
  credit(inviter, REFERRAL_BONUS, "referral");
  credit(newUserId, REFERRAL_BONUS, "referral_welcome");
  audit({ userId: inviter, kind: "referral_rewarded", detail: newUserId });
}

export function referralStats(userId: string) {
  const invited = [...db.users.values()].filter((u) => u.referredBy === userId).length;
  const earned = db.ledger.filter((e) => e.userId === userId && e.reason === "referral").reduce((s, e) => s + e.delta, 0);
  return { code: referralCode(userId), invited, earned, bonus: REFERRAL_BONUS };
}
