"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { btn, chip, pretty, Portrait, theme, type CharacterCard } from "./ui";

const CATEGORIES = [["girls", "Girls"], ["milf", "MILF"], ["anime", "Anime"], ["guys", "Guys"]] as const;
const ETHNICITIES = ["caucasian", "latina", "asian", "arab", "african", "south_asian"];
const HAIRS = ["blonde", "brown", "black", "red", "auburn"];
const AGES = [["20s", "20s"], ["30s", "30s"], ["40plus", "40+"]] as const;

export default function Home() {
  const [status, setStatus] = useState("loading");
  const [balance, setBalance] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("girls");
  const [ethnicity, setEthnicity] = useState("");
  const [hair, setHair] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [chars, setChars] = useState<CharacterCard[]>([]);

  async function refresh() {
    setStatus((await (await fetch("/api/verify-age")).json()).ageStatus);
    setBalance((await (await fetch("/api/tokens")).json()).balance);
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

  return (
    <main>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>AI Chat</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {verified ? <span style={{ color: theme.muted }}>Tokens: <b style={{ color: theme.text }}>{balance}</b></span> : <button style={btn} onClick={verify}>Verify age (18+)</button>}
          <Link href="/create"><button style={{ ...btn, background: "#333" }}>+ Create character</button></Link>
        </div>
      </header>
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
          <Link key={c.id} href={verified ? `/chat?c=${c.id}` : "#"} onClick={(e) => { if (!verified) { e.preventDefault(); alert("Verify your age (18+) to start chatting."); } }} style={{ color: "inherit", textDecoration: "none" }}>
            <article style={{ background: theme.card, borderRadius: 14, padding: 8 }}>
              <Portrait c={c} />
              <div style={{ padding: "8px 4px" }}>
                <b>{c.name}</b> <span style={{ color: theme.muted }}>{c.age}</span>
                <div style={{ fontSize: 12, color: theme.muted }}>{pretty(c.occupation)} · {pretty(c.personality)}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{c.tagline}</div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </main>
  );
}
