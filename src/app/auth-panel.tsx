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
  const [birthDate, setBirthDate] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const r = await fetch(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify({ email, password, confirmAdultAndTerms: confirm, birthDate }) });
    setBusy(false);
    if (!r.ok) return setErr((await r.json()).error ?? "Something went wrong");
    onDone();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 24 }}>{mode === "register" ? t("signup") : t("login")}</h2>
      <input className="field" type="email" autoComplete="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="field" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      {mode === "register" && <BirthDateField value={birthDate} onChange={setBirthDate} />}
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

const MAX_BIRTH = () => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().slice(0, 10); };

function BirthDateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "grid", gap: 4, fontSize: 13, color: "#c9c9d6" }}>
      Date of birth (you must be 18+)
      <input className="field" type="date" required value={value} max={MAX_BIRTH()} min="1920-01-01" onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/** Age gate for accounts made before signup asked for a date of birth. */
export function AgeGateModal({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [birthDate, setBirthDate] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm) return setErr("Please confirm you are 18 or older.");
    const r = await fetch("/api/verify-age", { method: "POST", body: JSON.stringify({ action: "self", birthDate }) });
    if (!r.ok) return setErr((await r.json()).error ?? "Something went wrong");
    onDone();
  }
  return (
    <div className="backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Quick age check</h2>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>FlirtIQ is for adults only. Enter your date of birth to continue.</p>
        <BirthDateField value={birthDate} onChange={setBirthDate} />
        <label style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "flex-start", color: "#c9c9d6" }}>
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} style={{ marginTop: 3 }} />
          <span>I confirm I am 18 or older and the date above is true.</span>
        </label>
        {err && <div style={{ color: "#ff8a8a", fontSize: 14 }}>{err}</div>}
        <button className="btn">Continue</button>
      </form>
    </div>
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
