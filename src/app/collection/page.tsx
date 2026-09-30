"use client";
import { useEffect, useState } from "react";
import { pretty, theme } from "../ui";

interface Media { id: string; characterId: string; kind: string; scene: string; status: string; url?: string }

export default function Collection() {
  const [media, setMedia] = useState<Media[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    void fetch("/api/media").then(async (r) => {
      const b = await r.json();
      if (r.ok) setMedia(b.media.filter((m: Media) => m.url)); else setErr(b.error);
    });
  }, []);
  return (
    <main>
      <h1>Collection</h1>
      {err && <p style={{ color: "#ff8a8a" }}>{err}</p>}
      {media?.length === 0 && <p style={{ color: theme.muted }}>Photos and videos you get from characters appear here.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
        {media?.map((m) => (
          <figure key={m.id} style={{ margin: 0, background: theme.card, borderRadius: 10, padding: 4 }}>
            <img src={m.url} alt={`AI-generated ${m.kind}`} style={{ width: "100%", borderRadius: 8 }} />
            <figcaption style={{ fontSize: 11, color: theme.muted }}>AI · {pretty(m.scene)}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
