"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { btn, pretty, Portrait, theme, type CharacterCard } from "../ui";

export default function MyAI() {
  const [chars, setChars] = useState<CharacterCard[] | null>(null);
  const [err, setErr] = useState("");
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
          <Link key={c.id} href={`/chat?c=${c.id}`} style={{ color: "inherit", textDecoration: "none", background: theme.card, borderRadius: 14, padding: 8 }}>
            <Portrait c={c} />
            <div style={{ padding: 6 }}><b>{c.name}</b> <span style={{ color: theme.muted }}>{c.age}</span>
              <div style={{ fontSize: 12, color: theme.muted }}>{pretty(c.occupation)} · {pretty(c.personality)}</div></div>
          </Link>
        ))}
      </div>
    </main>
  );
}
