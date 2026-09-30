import { afterEach, describe, expect, it } from "vitest";
import { grantTokens, isAdmin, listUsers, reports, requireAdmin, resolveReport, setBanned, stats } from "./admin";
import { register, createSession } from "./auth";
import { balance } from "./tokens/ledger";
import { db, getUser } from "./store";
import { mediaJobs } from "./media/jobs";

afterEach(() => { delete process.env.ADMIN_EMAILS; });

describe("admin", () => {
  it("only listed emails are admins", () => {
    const a = register("boss@example.com", "password123", true);
    const u = register("user1@example.com", "password123", true);
    process.env.ADMIN_EMAILS = "Boss@example.com, other@x.com";
    expect(isAdmin(a.id)).toBe(true);
    expect(isAdmin(u.id)).toBe(false);
    expect(() => requireAdmin(u.id)).toThrow();
  });

  it("ban ends sessions; unban clears strikes; grant adds tokens", () => {
    const u = register("user2@example.com", "password123", true);
    const sid = createSession(u.id);
    getUser(u.id).strikes = 2;
    setBanned("admin", u.id, true);
    expect(getUser(u.id).banned).toBe(true);
    expect(db.sessions.get(sid)).toBeUndefined();
    setBanned("admin", u.id, false);
    expect(getUser(u.id).strikes).toBe(0);
    grantTokens("admin", u.id, 25);
    expect(balance(u.id)).toBe(25);
  });

  it("lists users, stats, and resolves reports", () => {
    expect(listUsers("user2@")[0].email).toBe("user2@example.com");
    expect(stats().users).toBeGreaterThan(0);
    mediaJobs.set("rep1", { id: "rep1", userId: "x", characterId: "featured-1", kind: "image", scene: "portrait", status: "ready", aiGenerated: true, hidden: true, createdAt: Date.now() });
    expect(reports().some((r) => r.id === "rep1")).toBe(true);
    expect(stats().openReports).toBeGreaterThan(0);
    resolveReport("admin", "rep1", true);
    expect(mediaJobs.get("rep1")!.hidden).toBe(false);
  });
});
