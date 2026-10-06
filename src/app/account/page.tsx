"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Account {
  email?: string; premium: boolean; plan: string | null; monthlyCredits: number | null; premiumUntil: number | null; daysLeft: number;
  nextCreditsAt: number | null; balance: number;
  orders: { id: string; label: string; priceInr: number; status: "paid" | "pending"; at: number | null }[];
  credits: { amount: number; reason: string; at: number }[];
}

const date = (t: number | null) => (t ? new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const REASON: Record<string, string> = { premium_grant: "Monthly Premium credits", purchase: "Credit top-up", free_trial: "Free welcome messages", daily: "Daily reward", admin_grant: "Bonus from FlirtIQ", refund: "Refund" };

export default function AccountPage() {
  const [a, setA] = useState<Account | null | undefined>(undefined);
  useEffect(() => {
    const load = () => fetch("/api/account").then((r) => (r.ok ? r.json() : null)).then(setA);
    void load();
    // Crypto payments confirm after a few minutes; refresh while an order is pending.
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, []);

  if (a === undefined) return <main><p className="muted">Loading…</p></main>;
  if (a === null) return <main><h1>My account</h1><p className="muted">Please <Link href="/">log in</Link> to see your membership.</p></main>;
  const pending = a.orders.some((o) => o.status === "pending");
  return (
    <main style={{ maxWidth: 820 }}>
      <h1 style={{ marginBottom: 4 }}>My account</h1>
      <p className="muted" style={{ marginTop: 0 }}>{a.email}</p>

      <div className="acc-grid">
        <section className={`acc-card ${a.premium ? "gold" : ""}`}>
          <div className="acc-k">Membership</div>
          {a.premium ? (<>
            <div className="acc-v">👑 Premium</div>
            <div>{a.plan} plan · <b>{a.daysLeft} {a.daysLeft === 1 ? "day" : "days"} left</b></div>
            <div className="muted">Valid till {date(a.premiumUntil)}</div>
            <div className="acc-bar"><i style={{ width: `${Math.min(100, Math.max(4, (a.daysLeft / 30) * 100))}%` }} /></div>
          </>) : (<>
            <div className="acc-v">Free</div>
            <div className="muted">Upgrade for monthly credits, voice notes and private galleries.</div>
            <Link href="/premium" className="btn btn-gold" style={{ marginTop: 10 }}>Get Premium</Link>
          </>)}
        </section>

        <section className="acc-card">
          <div className="acc-k">Credits</div>
          <div className="acc-v">💎 {a.balance.toLocaleString("en-IN")}</div>
          <div className="muted">1 per message · 5 per voice note · 20 per photo</div>
          {a.premium && a.monthlyCredits && <div className="muted">+{a.monthlyCredits} credits {a.nextCreditsAt ? `on ${date(a.nextCreditsAt)}` : "each month of your plan"}</div>}
          <Link href={a.premium ? "/premium#credits" : "/premium"} className="btn" style={{ marginTop: 10 }}>{a.premium ? "Top up credits" : "Get more credits"}</Link>
        </section>
      </div>

      {pending && <p className="pp-msg">⏳ A payment is being confirmed. This page updates automatically.</p>}

      <h2 style={{ margin: "28px 0 10px" }}>Purchases</h2>
      {a.orders.length === 0 ? <p className="muted">No purchases yet.</p> : (
        <div className="acc-table">
          {a.orders.map((o) => (
            <div key={o.id} className="acc-row">
              <span>{o.label}</span>
              <span>₹{o.priceInr.toLocaleString("en-IN")}</span>
              <span className={o.status === "paid" ? "ok" : "wait"}>{o.status === "paid" ? "✓ Paid" : "Pending"}</span>
              <span className="muted">{date(o.at)}</span>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ margin: "28px 0 10px" }}>Credits added</h2>
      {a.credits.length === 0 ? <p className="muted">None yet.</p> : (
        <div className="acc-table">
          {a.credits.map((c, i) => (
            <div key={i} className="acc-row">
              <span>{REASON[c.reason] ?? c.reason.replace(/_/g, " ")}</span>
              <span className="ok">+{c.amount}</span>
              <span />
              <span className="muted">{date(c.at)}</span>
            </div>
          ))}
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, marginTop: 20 }}>Premium plans are one-time payments and do not renew automatically. Questions about a payment? See <Link href="/contact">Contact</Link>.</p>
    </main>
  );
}
