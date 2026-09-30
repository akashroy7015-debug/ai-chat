"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { btn, chip, pretty, Portrait, theme, type CharacterCard } from "./ui";
import { AuthPanel } from "./auth-panel";

const CATEGORIES = [["girls", "Girls"], ["milf", "MILF"], ["anime", "Anime"], ["guys", "Guys"]] as const;
const ETHNICITIES = ["caucasian", "latina", "asian", "arab", "african", "south_asian"];
const HAIRS = ["blonde", "brown", "black", "red", "auburn"];
const AGES = [["20s", "20s"], ["30s", "30s"], ["40plus", "40+"]] as const;

export default function Home() {
  const [status, setStatus] = useState("loading");
  const [me, setMe] = useState<{ email?: string; premium?: boolean; admin?: boolean } | null | undefined>(undefined);
  const [balance, setBalance] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("girls");
  const [ethnicity, setEthnicity] = useState("");
  const [hair, setHair] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [chars, setChars] = useState<CharacterCard[]>([]);
  const [settings, setSettings] = useState<{ explicitOptIn: boolean; explicitActive: boolean; explicitAvailable: boolean; grievanceOfficer?: { name: string; email: string } }>({ explicitOptIn: false, explicitActive: false, explicitAvailable: false });
  const [packages, setPackages] = useState<Record<string, { label: string; priceUsd: number }>>({});

  async function refresh() {
    setPackages((await (await fetch("/api/checkout")).json()).packages);
    const r = await fetch("/api/auth/me");
    if (!r.ok) { setMe(null); setStatus("unverified"); return; }
    const m = await r.json();
    setMe(m);
    setStatus(m.ageStatus);
    setBalance(m.balance);
    setSettings(m);
  }

  async function setExplicit(on: boolean) {
    if (on && !confirm("Enable adult content? You confirm you are 18+ and want to see mature content.")) return;
    const r = await fetch("/api/settings", { method: "POST", body: JSON.stringify({ explicit: on }) });
    if (!r.ok) alert((await r.json()).error);
    await refresh();
  }

  async function buy(pkg: string) {
    const r = await fetch("/api/checkout", { method: "POST", body: JSON.stringify({ pkg }) });
    if (!r.ok) alert((await r.json()).error);
    await refresh();
  }
  useEffect(() => { void refresh(); }, []);

  useEffect(() => {
    const q = new URLSearchParams({ category, ...(ethnicity && { ethnicity }), ...(hair && { hair }), ...(ageRange && { ageRange }) });
    void fetch(`/api/characters/featured?${q}`).then((r) => r.json()).then((b) => setChars(b.characters));
  }, [category, ethnicity, hair, ageRange]);

  async function verify() {
    await fetch("/api/verify-age", { method: "POST", body: JSON.stringify({}) });
    // Dev mock: completes instantly. A real provider redirects to its hosted flow, then calls back.
    await fetch("/api/verify-age", { method: "POST", body: JSON.stringify({ action: "complete" }) });
    await refresh();
  }

  const toggle = (cur: string, set: (v: string) => void, v: string) => set(cur === v ? "" : v);
  const verified = status === "verified";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
  }

  return (
    <main>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>AI Chat</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {me?.premium && <span style={{ background: "#b8860b", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>👑 PREMIUM</span>}
          {me?.admin && <Link href="/admin" style={{ color: theme.muted }}>Admin</Link>}
          {me && (verified ? <span style={{ color: theme.muted }}>Tokens: <b style={{ color: theme.text }}>{balance}</b></span> : <button style={btn} onClick={verify}>Verify with ID (18+)</button>)}
          {me && <Link href="/create"><button style={{ ...btn, background: "#333" }}>+ Create character</button></Link>}
          {me && <button style={{ ...btn, background: "transparent", color: theme.muted }} onClick={logout}>Log out</button>}
        </div>
      </header>
      {me === null && <AuthPanel onDone={refresh} />}
      {verified && (
        <section style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", background: theme.card, padding: 12, borderRadius: 12, margin: "12px 0" }}>
          {settings.explicitAvailable && (
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="checkbox" checked={settings.explicitOptIn} onChange={(e) => void setExplicit(e.target.checked)} />
              Adult content (ID-verified 18+ only)
            </label>
          )}
          <span style={{ color: theme.muted }}>Buy tokens:</span>
          {Object.entries(packages).map(([k, p]) => <button key={k} style={chip(false)} onClick={() => void buy(k)}>{p.label} · ${p.priceUsd}</button>)}
        </section>
      )}
      <p style={{ color: theme.muted }}>18+ only. Every character is a fictional adult and not based on a real person.</p>

      <nav style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        {CATEGORIES.map(([v, l]) => <button key={v} style={{ ...chip(category === v), fontSize: 15, padding: "8px 18px" }} onClick={() => setCategory(v)}>{l}</button>)}
      </nav>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {ETHNICITIES.map((e) => <button key={e} style={chip(ethnicity === e)} onClick={() => toggle(ethnicity, setEthnicity, e)}>{pretty(e)}</button>)}
        {HAIRS.map((h) => <button key={h} style={chip(hair === h)} onClick={() => toggle(hair, setHair, h)}>{pretty(h)}</button>)}
        {AGES.map(([v, l]) => <button key={v} style={chip(ageRange === v)} onClick={() => toggle(ageRange, setAgeRange, v)}>{l}</button>)}
      </div>

      <h2>Explore featured characters</h2>
      {chars.length === 0 && <p style={{ color: theme.muted }}>No characters match these filters.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
        {chars.map((c) => (
          <Link key={c.id} href={verified ? `/chat?c=${c.id}` : "#"} onClick={(e) => { if (!verified) { e.preventDefault(); alert(me ? "Verify your age (18+) to start chatting." : "Create a free account to start chatting."); } }} style={{ color: "inherit", textDecoration: "none" }}>
            <article style={{ background: theme.card, borderRadius: 14, padding: 8 }}>
              <Portrait c={c} />
              <div style={{ padding: "8px 4px" }}>
                <b>{c.name}</b> <span style={{ color: theme.muted }}>{c.age}</span>
                <div style={{ fontSize: 12, color: theme.muted }}>{pretty(c.occupation)} · {pretty(c.personality)}{c.outfit ? ` · ${pretty(c.outfit)}` : ""}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{c.tagline}</div>
              </div>
            </article>
          </Link>
        ))}
      </div>
      <footer style={{ marginTop: 32, color: theme.muted, fontSize: 12 }}>
        All characters and media are AI-generated and fictional. Report content from any gallery item.{" "}
        <Link href="/terms" style={{ color: theme.muted }}>Terms</Link> · <Link href="/privacy" style={{ color: theme.muted }}>Privacy</Link> · <Link href="/grievance" style={{ color: theme.muted }}>Grievances</Link>.
        {settings.grievanceOfficer && <> Grievance Officer: {settings.grievanceOfficer.name} · {settings.grievanceOfficer.email}</>}
      </footer>
    </main>
  );
}
