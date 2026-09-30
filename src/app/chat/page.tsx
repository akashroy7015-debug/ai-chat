"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { btn, field, pretty, Portrait, theme, type CharacterCard } from "../ui";

interface Line { who: "you" | "them"; text: string; id?: string }
interface Media { id: string; kind: string; scene: string; status: string; url?: string }

function Chat() {
  const cid = useSearchParams().get("c");
  const [c, setC] = useState<CharacterCard | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [err, setErr] = useState("");
  const [media, setMedia] = useState<Media[]>([]);
  const [scenes, setScenes] = useState<string[]>([]);
  const [costs, setCosts] = useState<Record<string, number>>({});
  const [scene, setScene] = useState("selfie");
  const [mediaOn, setMediaOn] = useState(false);
  const [voice, setVoice] = useState<{ enabled: boolean; cost: number }>({ enabled: false, cost: 5 });
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => { void fetch("/api/voice").then((r) => (r.ok ? r.json() : null)).then((b) => b && setVoice(b)); }, []);

  async function play(id: string) {
    setPlaying(id);
    const r = await fetch(`/api/voice?messageId=${id}`);
    if (!r.ok) { setPlaying(null); return alert((await r.json()).error); }
    const audio = new Audio(URL.createObjectURL(await r.blob()));
    audio.onended = () => setPlaying(null);
    void audio.play();
  }

  async function loadMedia() {
    if (!cid) return;
    const r = await fetch(`/api/media?characterId=${cid}`);
    if (!r.ok) return;
    const b = await r.json();
    setMedia(b.media); setScenes(b.scenes); setCosts(b.costs); setMediaOn(b.enabled);
  }
  useEffect(() => { void loadMedia(); }, [cid]);
  // Poll while anything is still being generated.
  useEffect(() => {
    if (!media.some((m) => ["queued", "generating", "checking"].includes(m.status))) return;
    const t = setTimeout(() => void loadMedia(), 2000);
    return () => clearTimeout(t);
  }, [media]);

  async function requestMedia(kind: "image" | "video") {
    const r = await fetch("/api/media", { method: "POST", body: JSON.stringify({ characterId: cid, kind, scene }) });
    if (!r.ok) alert((await r.json()).error);
    await loadMedia();
  }

  async function report(id: string) {
    const reason = prompt("Why are you reporting this?") ?? "";
    await fetch("/api/media/report", { method: "POST", body: JSON.stringify({ id, reason }) });
    await loadMedia();
  }

  useEffect(() => {
    if (!cid) return;
    void fetch(`/api/characters/${cid}`).then(async (r) => {
      const b = await r.json();
      if (r.ok) setC(b.character); else setErr(b.error);
    });
    void fetch(`/api/chat?characterId=${cid}`).then(async (r) => {
      if (!r.ok) return;
      const b = await r.json();
      setLines(b.messages.map((m: { id: string; role: string; content: string }) => ({ who: m.role === "user" ? "you" : "them", text: m.content, id: m.id })));
    });
  }, [cid]);

  async function send() {
    if (!c || !input.trim()) return;
    const text = input;
    setInput("");
    setLines((l) => [...l, { who: "you", text }]);
    const r = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ characterId: c.id, message: text }) });
    const b = await r.json();
    setLines((l) => [...l, { who: "them", text: b.message ?? b.error, id: b.messageId }]);
  }

  if (err || !cid) return <main><p style={{ color: "#ff8a8a" }}>{err || "No character selected."}</p><Link href="/">Back to characters</Link></main>;
  if (!c) return <main>Loading…</main>;

  return (
    <main className="chatgrid" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16 }}>
      <style>{`@media (max-width:760px){.chatgrid{grid-template-columns:1fr !important}}`}</style>
      <aside>
        <Link href="/" style={{ color: theme.muted }}>← All characters</Link>
        <div style={{ marginTop: 8 }}><Portrait c={c} height={240} /></div>
        <h2 style={{ marginBottom: 4 }}>{c.name}, {c.age}</h2>
        <div style={{ color: theme.muted, fontSize: 13 }}>{pretty(c.occupation)} · {pretty(c.personality)} · {pretty(c.ethnicity)}</div>
        <p style={{ fontSize: 14 }}>{c.tagline}</p>
        {!mediaOn && <p style={{ color: theme.muted, fontSize: 13 }}>Photos &amp; videos coming soon.</p>}
        {mediaOn && <div style={{ display: "grid", gap: 6 }}>
          <select style={field} value={scene} onChange={(e) => setScene(e.target.value)}>
            {scenes.map((s) => <option key={s} value={s}>{pretty(s)}</option>)}
          </select>
          <button style={btn} onClick={() => void requestMedia("image")}>Get a photo · {costs.image ?? "…"} tokens</button>
          <button style={{ ...btn, background: "#7a3cff" }} onClick={() => void requestMedia("video")}>Get a video · {costs.video ?? "…"} tokens</button>
        </div>}
        {mediaOn && <h3>Gallery</h3>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {media.map((m) => (
            <div key={m.id} style={{ background: theme.card, borderRadius: 8, padding: 4, fontSize: 11 }}>
              {m.url ? <img src={m.url} alt={`AI-generated ${m.kind}`} style={{ width: "100%", borderRadius: 6 }} /> : <div style={{ height: 80, display: "grid", placeItems: "center", color: theme.muted }}>{m.status === "blocked" ? "Blocked · refunded" : m.status === "failed" ? "Failed · refunded" : "Generating…"}</div>}
              <div style={{ display: "flex", justifyContent: "space-between", color: theme.muted }}>
                <span>AI · {pretty(m.scene)}</span>
                {m.url && <button onClick={() => void report(m.id)} style={{ background: "none", border: "none", color: theme.muted, cursor: "pointer", fontSize: 11 }}>Report</button>}
              </div>
            </div>
          ))}
        </div>
      </aside>
      <section style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, minHeight: 360 }}>
          {lines.length === 0 && <p style={{ color: theme.muted }}>Say hi to {c.name}.</p>}
          {lines.map((l, i) => (
            <p key={i} style={{ textAlign: l.who === "you" ? "right" : "left" }}>
              <span style={{ display: "inline-block", padding: "8px 12px", borderRadius: 14, background: l.who === "you" ? theme.accent : theme.card, maxWidth: "80%" }}>{l.text}</span>
              {voice.enabled && l.who === "them" && l.id && (
                <button title={`Play voice (${voice.cost} tokens, replays free)`} onClick={() => void play(l.id!)} style={{ marginLeft: 6, background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>{playing === l.id ? "⏳" : "🔊"}</button>
              )}
            </p>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...field, flex: 1 }} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void send()} placeholder={`Message ${c.name}…`} />
          <button style={btn} onClick={send}>Send</button>
        </div>
      </section>
    </main>
  );
}

export default function ChatPage() {
  return <Suspense><Chat /></Suspense>;
}
