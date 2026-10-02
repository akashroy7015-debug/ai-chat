"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { pretty, Portrait, type CharacterCard } from "../ui";
import { useT } from "../i18n";

interface Line { who: "you" | "them"; text: string; id?: string }
interface Media { id: string; kind: string; scene: string; status: string; url?: string }
interface Conv { character: { id: string; name: string; age: number; hair: string; style: string }; last: { role: string; content: string } }

function Chat() {
  const { t } = useT();
  const cid = useSearchParams().get("c");
  const [c, setC] = useState<CharacterCard | null>(null);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [err, setErr] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [scenes, setScenes] = useState<string[]>([]);
  const [costs, setCosts] = useState<Record<string, number>>({});
  const [scene, setScene] = useState("selfie");
  const [mediaOn, setMediaOn] = useState(false);
  const [voice, setVoice] = useState<{ enabled: boolean; cost: number }>({ enabled: false, cost: 5 });
  const [playing, setPlaying] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});
  async function rate(id: string, v: 1 | -1) {
    const r = await fetch("/api/feedback", { method: "POST", body: JSON.stringify({ messageId: id, vote: v }) });
    if (r.ok) { const b = await r.json(); setVotes((x) => ({ ...x, [id]: b.vote })); }
  }

  useEffect(() => { void fetch("/api/voice").then((r) => (r.ok ? r.json() : null)).then((b) => b && setVoice(b)); }, []);
  useEffect(() => { void fetch("/api/conversations").then((r) => (r.ok ? r.json() : null)).then((b) => b && setConvs(b.conversations)); }, [cid, lines.length]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [lines, typing]);

  useEffect(() => {
    if (!cid) return;
    setLines([]); setC(null); setErr("");
    void fetch(`/api/characters/${cid}`).then(async (r) => { const b = await r.json(); if (r.ok) setC(b.character); else setErr(b.error); });
    void fetch(`/api/chat?characterId=${cid}`).then(async (r) => {
      if (!r.ok) return;
      const b = await r.json();
      setLines(b.messages.map((m: { id: string; role: string; content: string }) => ({ who: m.role === "user" ? "you" : "them", text: m.content, id: m.id })));
    });
  }, [cid]);

  async function loadMedia() {
    if (!cid) return;
    const r = await fetch(`/api/media?characterId=${cid}`);
    if (!r.ok) return;
    const b = await r.json();
    setMedia(b.media); setScenes(b.scenes); setCosts(b.costs); setMediaOn(b.enabled);
  }
  useEffect(() => { void loadMedia(); }, [cid]);
  useEffect(() => {
    if (!media.some((m) => ["queued", "generating", "checking"].includes(m.status))) return;
    const tm = setTimeout(() => void loadMedia(), 2000);
    return () => clearTimeout(tm);
  }, [media]);

  async function send() {
    if (!c || !input.trim() || typing) return;
    const text = input;
    setInput("");
    setLines((l) => [...l, { who: "you", text }]);
    setTyping(true);
    const r = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ characterId: c.id, message: text }) });
    const b = await r.json();
    setTyping(false);
    setLines((l) => [...l, { who: "them", text: b.message ?? b.error, id: b.messageId }]);
  }

  async function play(id: string) {
    setPlaying(id);
    const r = await fetch(`/api/voice?messageId=${id}`);
    if (!r.ok) { setPlaying(null); return alert((await r.json()).error); }
    const audio = new Audio(URL.createObjectURL(await r.blob()));
    audio.onended = () => setPlaying(null);
    void audio.play();
  }

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

  if (err || !cid) return <main style={{ paddingTop: 20 }}><p style={{ color: "#ff8a8a" }}>{err || "No character selected."}</p><Link href="/" className="btn">← {t("allChars").replace("← ", "")}</Link></main>;

  return (
    <main style={{ paddingTop: 16 }}>
      <div className={`chatwrap ${showProfile ? "show-profile" : ""}`}>
        <aside className="list">
          <div style={{ padding: "14px 14px 8px", fontWeight: 800, fontSize: 18 }}>{t("chats")}</div>
          {convs.map((v) => (
            <Link key={v.character.id} href={`/chat?c=${v.character.id}`} className={`conv ${v.character.id === cid ? "on" : ""}`}>
              <div className="avatar-sm"><Portrait c={v.character} height="100%" round={0} /></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{v.character.name.split(" ")[0]}</div>
                <div className="muted" style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.last.role === "user" ? "You: " : ""}{v.last.content}</div>
              </div>
            </Link>
          ))}
        </aside>

        <section className="center">
          <div className="head">
            <Link href="/" className="muted" style={{ fontSize: 20 }}>←</Link>
            {c && <>
              <div className="avatar-sm" onClick={() => setShowProfile(true)} style={{ cursor: "pointer" }}><Portrait c={c} height="100%" round={0} /></div>
              <div onClick={() => setShowProfile(true)} style={{ cursor: "pointer" }}>
                <div style={{ fontWeight: 800 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "#2ee67a" }}>● Online</div>
              </div>
            </>}
          </div>
          <div className="msgs">
            {lines.map((l, i) => (
              <div key={i} className={`bubble ${l.who}`}>
                {l.text}
                {l.who === "them" && l.id && (
                  <span style={{ marginLeft: 8, whiteSpace: "nowrap" }}>
                    {([1, -1] as const).map((v) => (
                      <button key={v} title={v === 1 ? "Good reply" : "Bad reply"} onClick={() => void rate(l.id!, v)}
                        style={{ background: "none", border: 0, cursor: "pointer", fontSize: 13, opacity: votes[l.id!] === v ? 1 : 0.35 }}>{v === 1 ? "👍" : "👎"}</button>
                    ))}
                  </span>
                )}
                {voice.enabled && l.who === "them" && l.id && (
                  <button title={`Play voice (${voice.cost} tokens, replays free)`} onClick={() => void play(l.id!)} style={{ marginLeft: 8, background: "none", border: 0, cursor: "pointer", fontSize: 15 }}>{playing === l.id ? "⏳" : "🔊"}</button>
                )}
              </div>
            ))}
            {typing && <div className="typing">{c?.name.split(" ")[0]} is typing…</div>}
            <div ref={bottom} />
          </div>
          <div className="composer">
            <input className="field" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void send()} placeholder={c ? `${t("message")} ${c.name.split(" ")[0]}…` : ""} />
            <button className="btn" onClick={() => void send()} disabled={typing}>{t("send")}</button>
          </div>
        </section>

        <aside className="profile">
          {c && <>
            <button className="btn btn-ghost btn-sm" style={{ marginBottom: 10 }} onClick={() => setShowProfile(false)}>✕</button>
            <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "3/4", position: "relative" }}><Portrait c={c} height="100%" round={0} /></div>
            <h2 style={{ margin: "14px 0 2px" }}>{c.name}, {c.age}</h2>
            <p style={{ margin: "0 0 12px", color: "#d9d9e3" }}>{c.tagline}</p>
            <div className="chips" style={{ flexWrap: "wrap" }}>
              {[c.occupation, c.personality, c.ethnicity, c.outfit].filter(Boolean).map((x) => <span key={x} className="chip">{pretty(x!)}</span>)}
            </div>
            {mediaOn ? (
              <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
                <select className="field" value={scene} onChange={(e) => setScene(e.target.value)}>
                  {scenes.map((s) => <option key={s} value={s}>{pretty(s)}</option>)}
                </select>
                <button className="btn" onClick={() => void requestMedia("image")}>📸 Get a photo · {costs.image ?? "…"}💎</button>
                <button className="btn btn-ghost" onClick={() => void requestMedia("video")}>🎬 Get a video · {costs.video ?? "…"}💎</button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {media.map((m) => (
                    <div key={m.id} style={{ background: "var(--panel2)", borderRadius: 10, padding: 4, fontSize: 11 }}>
                      {m.url ? <img src={m.url} alt={`AI-generated ${m.kind}`} style={{ width: "100%", borderRadius: 8 }} /> : <div className="muted" style={{ height: 80, display: "grid", placeItems: "center" }}>{m.status === "blocked" ? "Blocked · refunded" : m.status === "failed" ? "Failed · refunded" : "Generating…"}</div>}
                      {m.url && <button onClick={() => void report(m.id)} className="muted" style={{ background: "none", border: 0, cursor: "pointer", fontSize: 11 }}>Report</button>}
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>📸 Photos &amp; videos coming soon.</p>}
          </>}
        </aside>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return <Suspense><Chat /></Suspense>;
}
