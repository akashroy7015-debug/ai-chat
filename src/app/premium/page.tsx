"use client";
import { useEffect, useState } from "react";
import { btn, theme } from "../ui";

interface Plan { id: string; label: string; months: number; priceUsd: number; perMonth: number; discountPct: number }

const PERKS = (tokens: number, cap: number) => [
  `Free chat with every character (up to ${cap} messages a day)`,
  `${tokens.toLocaleString()} tokens every month for photos, videos and voice`,
  "Premium badge on your profile",
];

export default function Premium() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [info, setInfo] = useState({ monthlyTokens: 1000, dailyChatCap: 300 });
  const [sel, setSel] = useState("yearly");
  const [me, setMe] = useState<{ premium?: boolean; premiumUntil?: number } | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const b = await (await fetch("/api/subscribe")).json();
    setPlans(b.plans); setInfo(b);
    const r = await fetch("/api/auth/me");
    setMe(r.ok ? await r.json() : null);
  }
  useEffect(() => { void load(); }, []);

  async function buy() {
    setMsg("");
    const r = await fetch("/api/subscribe", { method: "POST", body: JSON.stringify({ plan: sel }) });
    const b = await r.json();
    if (!r.ok) return setMsg(b.error);
    setMsg("Welcome to Premium! 🎉");
    await load();
  }

  return (
    <main style={{ maxWidth: 820 }}>
      <h1 style={{ marginBottom: 4 }}>Go Premium <span style={{ background: theme.accent, borderRadius: 8, padding: "2px 10px", fontSize: 18, verticalAlign: "middle" }}>up to -70%</span></h1>
      {me?.premium && <p style={{ color: "#6ee7a8" }}>You&apos;re Premium until {new Date(me.premiumUntil!).toLocaleDateString()}.</p>}
      <ul style={{ lineHeight: 1.9 }}>{PERKS(info.monthlyTokens, info.dailyChatCap).map((p) => <li key={p}>✅ {p}</li>)}</ul>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, margin: "16px 0" }}>
        {plans.map((p) => (
          <button key={p.id} onClick={() => setSel(p.id)} style={{ textAlign: "left", cursor: "pointer", background: theme.card, color: theme.text, borderRadius: 14, padding: 16, border: `2px solid ${sel === p.id ? theme.accent : theme.line}`, position: "relative" }}>
            {p.discountPct > 0 && <span style={{ position: "absolute", top: 10, right: 10, background: theme.accent, borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>-{p.discountPct}%</span>}
            <div style={{ fontWeight: 700 }}>{p.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, margin: "6px 0" }}>${p.perMonth}<span style={{ fontSize: 14, color: theme.muted }}>/month</span></div>
            <div style={{ color: theme.muted, fontSize: 13 }}>${p.priceUsd} billed every {p.months === 1 ? "month" : `${p.months} months`}</div>
          </button>
        ))}
      </div>
      {me === null ? <p style={{ color: theme.muted }}>Create a free account on the Home page to subscribe.</p>
        : <button style={{ ...btn, fontSize: 18, padding: "14px 28px" }} onClick={buy}>Get Premium</button>}
      {msg && <p>{msg}</p>}
      <p style={{ color: theme.muted, fontSize: 12, marginTop: 16 }}>Discounts are compared with paying monthly. Cancel any time; access continues until the end of the paid period. Requires ID-verified 18+ account.</p>
    </main>
  );
}
