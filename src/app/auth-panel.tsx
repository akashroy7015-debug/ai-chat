"use client";
import { useState } from "react";
import Link from "next/link";
import { useT } from "./i18n";

/** Sign up / log in. Rendered inside a modal (see AuthModal) or inline. */
export function AuthPanel({ onDone, initialMode = "register" }: { onDone: () => void; initialMode?: "login" | "register" }) {
  const { t } = useT();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const r = await fetch(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify({ email, password, confirmAdultAndTerms: confirm }) });
    setBusy(false);
    if (!r.ok) return setErr((await r.json()).error ?? "Something went wrong");
    onDone();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 24 }}>{mode === "register" ? t("signup") : t("login")}</h2>
      <input className="field" type="email" autoComplete="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="field" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      {mode === "register" && (
        <label style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "flex-start", color: "#c9c9d6" }}>
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} style={{ marginTop: 3 }} />
          <span>{t("confirm18")} (<Link href="/terms" style={{ color: "var(--pink)" }}>Terms</Link> · <Link href="/privacy" style={{ color: "var(--pink)" }}>Privacy</Link>)</span>
        </label>
      )}
      {err && <div style={{ color: "#ff8a8a", fontSize: 14 }}>{err}</div>}
      <button className="btn" disabled={busy}>{busy ? "…" : mode === "register" ? t("signupBtn") : t("login")}</button>
      <button type="button" className="btn btn-ghost" onClick={() => setMode(mode === "register" ? "login" : "register")}>
        {mode === "register" ? `${t("login")} →` : `${t("signup")} →`}
      </button>
    </form>
  );
}

export function AuthModal({ onDone, onClose, mode }: { onDone: () => void; onClose: () => void; mode?: "login" | "register" }) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <AuthPanel onDone={onDone} initialMode={mode} />
      </div>
    </div>
  );
}
