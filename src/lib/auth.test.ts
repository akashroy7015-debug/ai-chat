import { describe, expect, it } from "vitest";
import { AuthError, createSession, destroySession, hashPassword, login, register, sessionUser, verifyPassword } from "./auth";

describe("auth", () => {
  it("hashes and verifies", () => {
    const h = hashPassword("correct horse");
    expect(verifyPassword("correct horse", h)).toBe(true);
    expect(verifyPassword("wrong", h)).toBe(false);
    expect(h).not.toContain("correct");
  });
  it("registers and logs in, case-insensitive email", () => {
    const u = register("Ana@Example.com", "password123", true);
    expect(login("ana@example.com", "password123").id).toBe(u.id);
  });
  it("requires 18+/terms confirmation, valid email and password", () => {
    expect(() => register("b@example.com", "password123", false)).toThrow(AuthError);
    expect(() => register("not-an-email", "password123", true)).toThrow(AuthError);
    expect(() => register("c@example.com", "short", true)).toThrow(AuthError);
  });
  it("rejects duplicates and wrong passwords", () => {
    register("d@example.com", "password123", true);
    expect(() => register("d@example.com", "password123", true)).toThrow("already exists");
    expect(() => login("d@example.com", "nope")).toThrow("Wrong email or password");
    expect(() => login("nobody@example.com", "x")).toThrow("Wrong email or password");
  });
  it("rate-limits repeated failures", () => {
    register("e@example.com", "password123", true);
    for (let i = 0; i < 10; i++) expect(() => login("e@example.com", "bad")).toThrow();
    expect(() => login("e@example.com", "password123")).toThrow("Too many attempts");
  });
  it("sessions resolve and can be destroyed", () => {
    const u = register("f@example.com", "password123", true);
    const sid = createSession(u.id);
    expect(sessionUser(sid)).toBe(u.id);
    destroySession(sid);
    expect(sessionUser(sid)).toBeUndefined();
    expect(sessionUser("forged")).toBeUndefined();
  });
});
