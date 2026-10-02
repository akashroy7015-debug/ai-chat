"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { btn, pretty, Portrait, theme } from "../ui";
import { useT } from "../i18n";

interface Post { id: string; text: string; at: number; likes: number; liked: boolean; character: { id: string; name: string; age: number; hair: string; style: string; occupation: string } }

const ago = (t: number) => {
  const h = Math.round((Date.now() - t) / 3_600_000);
  return h < 1 ? "just now" : h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
};

export default function Discover() {
  const { t } = useT();
  const [posts, setPosts] = useState<Post[]>([]);
  const load = async () => setPosts((await (await fetch("/api/feed")).json()).posts);
  useEffect(() => { void load(); }, []);

  async function like(id: string) {
    const r = await fetch("/api/feed", { method: "POST", body: JSON.stringify({ postId: id }) });
    if (r.status === 401) return alert("Create a free account on the Home page to like posts.");
    await load();
  }

  return (
    <main style={{ maxWidth: 620 }}>
      <h1>{t("discover")}</h1>
      <div style={{ display: "grid", gap: 14 }}>
        {posts.map((p) => (
          <article key={p.id} style={{ background: theme.card, borderRadius: 16, padding: 14 }}>
            <header style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <div style={{ width: 44 }}><Portrait c={p.character} height={44} w={192} /></div>
              <div><b>{p.character.name}</b> <span style={{ color: theme.muted, fontSize: 13 }}>· {pretty(p.character.occupation)} · {ago(p.at)}</span></div>
            </header>
            <p style={{ fontSize: 16, margin: "0 0 12px" }}>{p.text}</p>
            <footer style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={() => void like(p.id)} style={{ background: "none", border: `1px solid ${theme.line}`, color: theme.text, borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}>
                {p.liked ? "❤️" : "🤍"} {p.likes}
              </button>
              <Link href={`/chat?c=${p.character.id}`} style={{ marginLeft: "auto" }}><button style={btn}>{t("chatWith")} {p.character.name.split(" ")[0]}</button></Link>
            </footer>
          </article>
        ))}
      </div>
    </main>
  );
}
