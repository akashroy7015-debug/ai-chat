import { describe, expect, it } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { isHttps, setSessionCookie } from "./http";

const req = (url: string, headers: Record<string, string> = {}) => new NextRequest(url, { headers });

describe("session cookie", () => {
  it("detects https directly or via proxy header", () => {
    expect(isHttps(req("http://1.2.3.4/"))).toBe(false);
    expect(isHttps(req("https://app.example.com/"))).toBe(true);
    expect(isHttps(req("http://127.0.0.1:3000/", { "x-forwarded-proto": "https" }))).toBe(true);
    expect(isHttps(req("http://127.0.0.1:3000/", { "x-forwarded-proto": "http" }))).toBe(false);
  });
  it("is not Secure on plain http (so browsers keep it) and Secure on https", () => {
    const a = NextResponse.json({});
    setSessionCookie(req("http://1.2.3.4/"), a, "s", 1);
    expect(a.headers.get("set-cookie")).not.toMatch(/Secure/i);
    const b = NextResponse.json({});
    setSessionCookie(req("http://127.0.0.1/", { "x-forwarded-proto": "https" }), b, "s", 1);
    expect(b.headers.get("set-cookie")).toMatch(/Secure/i);
    expect(b.headers.get("set-cookie")).toMatch(/HttpOnly/i);
  });
});
