import { credit, FREE_TRIAL_TOKENS } from "./tokens/ledger";
import { audit, db, getUser, PMap } from "./store";

/**
 * Free messages are tied to the account on the server, so refreshing or clearing the browser never
 * gives more. To stop people farming them with new accounts, each free trial is also tied to the
 * email's canonical form (Gmail dots and "+tags" removed) and limited per network (IP address).
 */
const MAX_PER_IP = 2;
const IP_WINDOW = 30 * 86_400_000;
const g = globalThis as unknown as { __trials?: PMap<{ count: number; at: number }> };
const claims: PMap<{ count: number; at: number }> = (g.__trials ??= new PMap(db.sql, "trial_claims"));

const DISPOSABLE = new Set(["mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "temp-mail.org", "yopmail.com", "trashmail.com", "getnada.com", "sharklasers.com", "dispostable.com", "maildrop.cc", "throwawaymail.com", "fakeinbox.com", "mintemail.com", "emailondeck.com", "moakt.com", "tempail.com", "mohmal.com", "burnermail.io", "spamgourmet.com"]);

/** a.b.c+promo@gmail.com and abc@googlemail.com are the same inbox: abc@gmail.com. */
export function canonicalEmail(email: string): string {
  const [local = "", domain = ""] = email.trim().toLowerCase().split("@");
  const base = local.split("+")[0];
  if (domain === "gmail.com" || domain === "googlemail.com") return `${base.replace(/\./g, "")}@gmail.com`;
  return `${base}@${domain}`;
}

export const isDisposable = (email: string) => DISPOSABLE.has(email.trim().toLowerCase().split("@")[1] ?? "");

/** Grants the free messages once, if this inbox and network haven't already had them. Returns whether granted. */
export function grantTrialIfEligible(userId: string, ip: string | undefined, now = Date.now()): boolean {
  if (db.ledger.some((e) => e.userId === userId && e.reason === "free_trial")) return false;
  const email = getUser(userId).email;
  const deny = (why: string) => { audit({ userId, kind: "trial_denied", detail: why }); return false; };
  if (!email) return deny("no email");
  if (isDisposable(email)) return deny("disposable email");
  const eKey = `e:${canonicalEmail(email)}`;
  if (claims.get(eKey)) return deny("email already used a trial");
  const ipKey = ip ? `ip:${ip}` : "";
  const ipClaim = ipKey ? claims.get(ipKey) : undefined;
  const ipCount = ipClaim && now - ipClaim.at < IP_WINDOW ? ipClaim.count : 0;
  if (ipCount >= MAX_PER_IP) return deny("network trial limit");
  credit(userId, FREE_TRIAL_TOKENS, "free_trial");
  claims.set(eKey, { count: 1, at: now });
  if (ipKey) claims.set(ipKey, { count: ipCount + 1, at: ipClaim && ipCount ? ipClaim.at : now });
  return true;
}

/** Client IP as seen by Caddy (first X-Forwarded-For hop). */
export function clientIp(h: Headers): string | undefined {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
}
