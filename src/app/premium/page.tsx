"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "../i18n";

interface Plan { id: string; label: string; months: number; priceInr: number; perMonth: number; discountPct: number }
interface Pack { id: string; tokens: number; priceInr: number; label: string }
type Me = { premium?: boolean; premiumUntil?: number; balance?: number } | null;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function Premium() {
  const { t } = useT();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [monthly, setMonthly] = useState(600);
  const [costs, setCosts] = useState({ chat: 1, voice: 5, image: 20 });
  const [sel, setSel] = useState("yearly");
  const [me, setMe] = useState<Me | undefined>(undefined);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    const [s, c, r] = await Promise.all([fetch("/api/subscribe"), fetch("/api/checkout"), fetch("/api/auth/me")]);
    const sb = await s.json();
    setPlans(sb.plans); setMonthly(sb.monthlyTokens); if (sb.costs) setCosts(sb.costs);
    const cb = await c.json();
    setPacks(Object.entries(cb.packages as Record<string, Omit<Pack, "id">>).map(([id, p]) => ({ id, ...p })));
    setMe(r.ok ? await r.json() : null);
  }
  useEffect(() => { void load(); }, []);

  async function pay(url: string, payload: object, ok: string) {
    setMsg(""); setBusy(JSON.stringify(payload));
    const r = await fetch(url, { method: "POST", body: JSON.stringify(payload) });
    const b = await r.json();
    setBusy("");
    if (b.checkoutUrl && !b.checkoutUrl.startsWith("/checkout/mock")) { window.location.href = b.checkoutUrl; return; }
    if (!r.ok) return setMsg(b.error ?? "Something went wrong");
    setMsg(ok);
    await load();
  }

  const premium = !!me?.premium;
  return (
    <main style={{ maxWidth: 880 }}>
      <h1 style={{ marginBottom: 4 }}>{t("goPremium")} <span className="pill gold" style={{ fontSize: 16, verticalAlign: "middle" }}>up to 70% off</span></h1>
      {premium && <p style={{ color: "#6ee7a8", margin: "4px 0" }}>You&apos;re Premium until {new Date(me!.premiumUntil!).toLocaleDateString("en-IN")} · 💎 {me?.balance ?? 0} credits left</p>}
      {me && !premium && <p className="muted" style={{ margin: "4px 0" }}>💎 {me.balance ?? 0} free credits left</p>}

      <section className="pp-how">
        <div><b>1</b><span>Sign up free and get <b>15 free messages</b></span></div>
        <div><b>2</b><span>Go Premium: <b>{monthly} credits every month</b> + exclusive galleries</span></div>
        <div><b>3</b><span>Ran out? <b>Top up credits</b> any time, pay as you go</span></div>
      </section>

      <h2 style={{ margin: "22px 0 10px" }}>Choose your plan</h2>
      <div className="pp-grid">
        {plans.map((p) => (
          <button key={p.id} onClick={() => setSel(p.id)} className={`pp-card ${sel === p.id ? "on" : ""}`}>
            {p.discountPct > 0 && <span className="pp-off">-{p.discountPct}%</span>}
            {p.id === "yearly" && <span className="pp-best">Best value</span>}
            <div className="pp-label">{p.label}</div>
            <div className="pp-price">{inr(p.perMonth)}<small>/month</small></div>
            <div className="muted" style={{ fontSize: 13 }}>{inr(p.priceInr)} one-time · no auto-renewal</div>
          </button>
        ))}
      </div>
      <ul className="pp-perks">
        <li>💎 {monthly} credits every month of your plan</li>
        <li>💬 Chat with every character ({costs.chat} credit per message)</li>
        <li>🔊 Voice notes ({costs.voice} credits) and 📸 photos ({costs.image} credits)</li>
        <li>🔒 Unlock every model&apos;s private photo &amp; video gallery</li>
        <li>👑 Premium badge · cancel any time</li>
      </ul>
      {me === null ? <Link href="/" className="btn btn-gold" style={{ fontSize: 18, padding: "14px 28px" }}>Sign up free first</Link>
        : <button className="btn btn-gold" style={{ fontSize: 18, padding: "14px 28px" }} disabled={!!busy || me === undefined} onClick={() => void pay("/api/subscribe", { plan: sel }, "Welcome to Premium! 🎉")}>{premium ? "Extend Premium" : t("getPremium")}</button>}

      <h2 id="credits" style={{ margin: "34px 0 6px" }}>Top up credits <span className="muted" style={{ fontSize: 14, fontWeight: 600 }}>· pay as you go</span></h2>
      <p className="muted" style={{ margin: "0 0 12px", fontSize: 14 }}>{premium ? "Credits never expire while you have an account." : "Credit packs are available to Premium members."}</p>
      <div className={`pp-grid ${premium ? "" : "locked"}`}>
        {packs.map((p) => (
          <div key={p.id} className="pp-card pack">
            {p.id === "popular" && <span className="pp-best">Most popular</span>}
            <div className="pp-price">💎 {p.tokens.toLocaleString("en-IN")}</div>
            <div className="muted" style={{ fontSize: 13 }}>≈ {Math.floor(p.tokens / costs.chat).toLocaleString("en-IN")} messages</div>
            <button className="btn" style={{ width: "100%", marginTop: 10 }} disabled={!premium || !!busy} onClick={() => void pay("/api/checkout", { pkg: p.id }, `Added ${p.tokens} credits 💎`)}>{inr(p.priceInr)}</button>
          </div>
        ))}
      </div>
      {msg && <p className="pp-msg">{msg}</p>}
      <p className="muted" style={{ fontSize: 12, marginTop: 18 }}>Prices include GST. Plans are one-time payments and do not renew automatically. All purchases are final; see our <Link href="/refund">Refund &amp; Cancellation Policy</Link>. Discounts are compared with paying monthly. 18+ only.</p>
    </main>
  );
}
