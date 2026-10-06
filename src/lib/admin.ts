import { AccessDenied } from "./age/verification";
import { balance, credit } from "./tokens/ledger";
import { mediaJobs } from "./media/jobs";
import { audit, db, getUser, saveUser } from "./store";
import { PACKAGES, type PackageId } from "./payments";
import { PLANS, type PlanId, isPremium } from "./premium";

/** Admins are listed by email in ADMIN_EMAILS (comma separated). */
export function isAdmin(userId: string): boolean {
  const email = getUser(userId).email;
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return !!email && admins.includes(email);
}

export function requireAdmin(userId: string) {
  if (!isAdmin(userId)) throw new AccessDenied("banned", "Not found.", 404);
}

const DAY = 86_400_000;

export function stats(now = Date.now()) {
  const users = [...db.users.values()].filter((u) => u.email);
  const paid = [...db.orders.values()].filter((o) => o.paid);
  const revenueInr = paid.reduce((s, o) => s + (o.pkg.startsWith("sub:") ? (PLANS[o.pkg.slice(4) as PlanId]?.priceInr ?? 0) : (PACKAGES[o.pkg as PackageId]?.priceInr ?? 0)), 0);
  return {
    users: users.length,
    premium: users.filter((u) => isPremium(u, now)).length,
    newUsers24h: users.filter((u) => (u.createdAt ?? 0) > now - DAY).length,
    verified: users.filter((u) => u.ageStatus === "verified").length,
    banned: users.filter((u) => u.banned).length,
    messages24h: db.messages.filter((m) => m.at > now - DAY && m.role === "user").length,
    activeUsers24h: new Set(db.messages.filter((m) => m.at > now - DAY).map((m) => m.userId)).size,
    paidOrders: paid.length,
    revenueInr,
    blocked24h: db.audit.filter((a) => a.at > now - DAY && /blocked/.test(a.kind)).length,
    openReports: [...mediaJobs.values()].filter((j) => j.hidden && !j.reviewed).length,
  };
}

/** Signups per day (last 14 days), top sources and invite results, for the admin Growth panel. */
export function growth(now = Date.now()) {
  const users = [...db.users.values()].filter((u) => u.email);
  const days = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(now - (13 - i) * DAY); start.setHours(0, 0, 0, 0);
    const s = start.getTime();
    const day = users.filter((u) => (u.createdAt ?? 0) >= s && (u.createdAt ?? 0) < s + DAY);
    const paidUsers = new Set([...db.orders.values()].filter((o) => o.paid && (o.paidAt ?? 0) >= s && (o.paidAt ?? 0) < s + DAY).map((o) => o.userId));
    return { date: start.toISOString().slice(5, 10), signups: day.length, buyers: paidUsers.size };
  });
  const since = now - 30 * DAY;
  const bySource = new Map<string, { signups: number; paying: number }>();
  for (const u of users.filter((x) => (x.createdAt ?? 0) > since)) {
    const k = u.signupSource ?? "unknown";
    const row = bySource.get(k) ?? { signups: 0, paying: 0 };
    row.signups++;
    if ([...db.orders.values()].some((o) => o.userId === u.id && o.paid)) row.paying++;
    bySource.set(k, row);
  }
  return {
    days,
    sources: [...bySource.entries()].map(([source, r]) => ({ source, ...r })).sort((a, b) => b.signups - a.signups).slice(0, 10),
    invitesRewarded30d: db.ledger.filter((e) => e.reason === "referral" && e.at > since).length,
  };
}

export function listUsers(query = "", limit = 50) {
  const q = query.trim().toLowerCase();
  return [...db.users.values()]
    .filter((u) => u.email && (!q || u.email.includes(q) || u.id === q))
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .slice(0, limit)
    .map((u) => ({
      id: u.id, email: u.email, ageStatus: u.ageStatus, idCountry: u.idCountry, banned: u.banned, strikes: u.strikes,
      createdAt: u.createdAt, balance: balance(u.id),
      messages: db.messages.filter((m) => m.userId === u.id && m.role === "user").length,
    }));
}

export function setBanned(adminId: string, userId: string, banned: boolean) {
  const u = db.users.get(userId);
  if (!u) throw new AccessDenied("banned", "User not found.", 404);
  u.banned = banned;
  if (!banned) u.strikes = 0;
  saveUser(u);
  // Banning also ends their sessions.
  if (banned) for (const s of [...db.sessions.values()]) if (s.userId === userId) db.sessions.delete(s.id);
  audit({ userId: adminId, kind: banned ? "admin_ban" : "admin_unban", detail: userId });
}

export function grantTokens(adminId: string, userId: string, amount: number) {
  if (!db.users.get(userId)) throw new AccessDenied("banned", "User not found.", 404);
  credit(userId, amount, `admin_grant:${adminId}`);
  audit({ userId: adminId, kind: "admin_grant", detail: `${userId} +${amount}` });
}

export function reports() {
  return [...mediaJobs.values()]
    .filter((j) => j.hidden)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((j) => ({
      id: j.id, userId: j.userId, email: getUser(j.userId).email, characterId: j.characterId, kind: j.kind, scene: j.scene,
      url: j.url, reviewed: !!j.reviewed, createdAt: j.createdAt,
      reason: db.audit.find((a) => a.kind === "media_reported" && a.detail.startsWith(j.id))?.detail.slice(j.id.length + 1) ?? "",
    }));
}

/** Resolve a report: keep it removed (default) or restore it to the user. */
export function resolveReport(adminId: string, jobId: string, restore: boolean) {
  const j = mediaJobs.get(jobId);
  if (!j) throw new AccessDenied("banned", "Not found.", 404);
  j.reviewed = true;
  j.hidden = !restore;
  mediaJobs.save(jobId);
  audit({ userId: adminId, kind: restore ? "report_restored" : "report_removed", detail: jobId });
}

export function recentAudit(limit = 100, kind?: string) {
  return db.audit.filter((a) => !kind || a.kind.includes(kind)).slice(-limit).reverse()
    .map((a) => ({ ...a, email: a.userId ? db.users.get(a.userId)?.email : undefined }));
}
