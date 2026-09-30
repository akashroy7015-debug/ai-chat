"use client";
import { useState } from "react";
import Link from "next/link";
import { btn, field, theme } from "./ui";

export function AuthPanel({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const r = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify({ email, password, confirmAdultAndTerms: confirm }),
    });
    setBusy(false);
    if (!r.ok) return setErr((await r.json()).error ?? "Something went wrong");
    onDone();
  }

  return (
    <form onSubmit={submit} style={{ background: theme.card, padding: 16, borderRadius: 12, display: "grid", gap: 10, maxWidth: 380, margin: "12px 0" }}>
      <div style={{ display: "flex", gap: 8 }}>
        {(["register", "login"] as const).map((m) => (
          <button type="button" key={m} onClick={() => setMode(m)} style={{ ...btn, background: mode === m ? theme.accent : "#333", flex: 1 }}>
            {m === "register" ? "Create free account" : "Log in"}
          </button>
        ))}
      </div>
      <input style={field} type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input style={field} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      {mode === "register" && (
        <label style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
          <span>I am 18 or older and accept the <Link href="/terms" style={{ color: theme.accent }}>Terms</Link> and <Link href="/privacy" style={{ color: theme.accent }}>Privacy Policy</Link>. I understand ID verification is required to chat.</span>
        </label>
      )}
      {err && <div style={{ color: "#ff8a8a", fontSize: 14 }}>{err}</div>}
      <button style={btn} disabled={busy}>{busy ? "…" : mode === "register" ? "Sign up" : "Log in"}</button>
    </form>
  );
}
