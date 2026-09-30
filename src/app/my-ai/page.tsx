"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { btn, pretty, Portrait, theme, type CharacterCard } from "../ui";

export default function MyAI() {
  const [chars, setChars] = useState<CharacterCard[] | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [v, setV] = useState(0);
  async function picture(id: string) {
    if (!confirm("Create a picture for this character? Costs 20 tokens (refunded if it fails).")) return;
    setBusy(id);
    const r = await fetch(`/api/portraits/${id}`, { method: "POST" });
    setBusy(null);
    if (!r.ok) return alert((await r.json()).error);
    setV(Date.now());
  }
  useEffect(() => {
    void fetch("/api/characters").then(async (r) => {
      const b = await r.json();
      if (r.ok) setChars(b.characters); else setErr(b.error);
    });
  }, []);
  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>My AI</h1>
        <Link href="/create"><button style={btn}>+ Create character</button></Link>
      </div>
      {err && <p style={{ color: "#ff8a8a" }}>{err}</p>}
      {chars?.length === 0 && <p style={{ color: theme.muted }}>You haven&apos;t created a character yet.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
        {chars?.map((c) => (
          <div key={c.id} style={{ background: theme.card, borderRadius: 14, padding: 8 }}>
          <Link href={`/chat?c=${c.id}`} style={{ color: "inherit", textDecoration: "none" }}>
            <Portrait key={v} c={{ ...c, portraitV: v || undefined }} />
            <div style={{ padding: 6 }}><b>{c.name}</b> <span style={{ color: theme.muted }}>{c.age}</span>
              <div style={{ fontSize: 12, color: theme.muted }}>{pretty(c.occupation)} · {pretty(c.personality)}</div></div>
          </Link>
          <button style={{ ...btn, width: "100%", padding: "6px", fontSize: 12, background: "#333" }} disabled={busy === c.id} onClick={() => void picture(c.id)}>
            {busy === c.id ? "Creating… (~30s)" : "🎨 Create picture · 20 tokens"}
          </button>
          </div>
        ))}
      </div>
    </main>
  );
}
