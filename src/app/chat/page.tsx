"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipVideo, pretty, Portrait, type CharacterCard } from "../ui";
import { useT } from "../i18n";

interface Line { who: "you" | "them"; text: string; id?: string; image?: "portrait" | "clip" | "locked" }

/** What she says with the locked photo when the free messages run out. */
const LOCKED_TEASE = ["I took this for you… 🔒", "ek photo bheji hai, sirf tumhare liye… 🔒", "don't go yet, I have something to show you 🔒", "you'll want to see this one… 🔒"];
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
  const [wallet, setWallet] = useState<{ premium: boolean; balance: number } | null>(null);
  const [paywall, setPaywall] = useState(false);
  const loadWallet = () => fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).then((b) => b && setWallet({ premium: !!b.premium, balance: b.balance ?? 0 }));
  useEffect(() => { void loadWallet(); }, []);
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
  type Level = { level: number; name: string; emoji: string; messages: number; nextAt: number | null; nextName: string | null; at: number };
  const [lvl, setLvl] = useState<Level | null>(null);
  const [fans, setFans] = useState<{ top: { rank: number; handle: string; messages: number; you: boolean }[]; yourRank: number | null } | null>(null);
  useEffect(() => { if (cid) void fetch(`/api/leaderboard?characterId=${cid}`).then((r) => (r.ok ? r.json() : null)).then((b) => b && setFans(b)); }, [cid, lvl?.messages]);
  const [pushState, setPushState] = useState<"unsupported" | "off" | "on">("unsupported");
  useEffect(() => {
    if (typeof window === "undefined" || !window.isSecureContext || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    void fetch("/api/push").then((r) => (r.ok ? r.json() : null)).then((b) => b && setPushState(b.subscribed ? "on" : "off"));
  }, []);
  async function enablePush() {
    const reg = await navigator.serviceWorker.register("/sw.js");
    if ((await Notification.requestPermission()) !== "granted") return;
    const { publicKey } = await (await fetch("/api/push")).json();
    const key = Uint8Array.from(atob(publicKey.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(publicKey.length / 4) * 4, "=")), (ch) => ch.charCodeAt(0));
    const subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    const r = await fetch("/api/push", { method: "POST", body: JSON.stringify({ subscription }) });
    if (r.ok) setPushState("on");
  }
  const [levelUp, setLevelUp] = useState<string | null>(null);
  useEffect(() => { if (cid) void fetch(`/api/relationship?characterId=${cid}`).then((r) => (r.ok ? r.json() : null)).then((b) => b && setLvl(b)); }, [cid]);
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
      setLines(b.messages.map((m: { id: string; role: string; content: string; image?: "portrait" | "clip" }) => ({ who: m.role === "user" ? "you" : "them", text: m.content, id: m.id, image: m.image })));
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

  async function send(preset?: string) {
    const text = (preset ?? input).trim();
    if (!c || !text || typing) return;
    setInput("");
    setLines((l) => [...l, { who: "you", text }]);
    setTyping(true);
    const r = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ characterId: c.id, message: text }) });
    const b = await r.json();
    setTyping(false);
    if (r.status === 402) {
      setLines((l) => l.slice(0, -1));
      setInput(text);
      void loadWallet();
      // Free users get a locked photo from her first; tapping it opens the paywall.
      if (!wallet?.premium && !lines.some((l) => l.image === "locked")) {
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          setLines((l) => [...l, { who: "them", text: LOCKED_TEASE[Math.floor(Math.random() * LOCKED_TEASE.length)], image: "locked" }]);
          setTimeout(() => setPaywall(true), 2500);
        }, 1400);
      } else setPaywall(true);
      return;
    }
    void loadWallet();
    setLines((l) => [...l, { who: "them", text: b.message ?? b.error, id: b.messageId }]);
    if (b.photo) setTimeout(() => setLines((l) => [...l, { who: "them", text: b.photo.content, id: b.photo.id, image: b.photo.image }]), 1200);
    if (b.level) {
      if (lvl && b.level.level > lvl.level) { setLevelUp(`${b.level.emoji} You're now her ${b.level.name}!`); setTimeout(() => setLevelUp(null), 4000); }
      setLvl(b.level);
    }
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
              <div className="avatar-sm"><Portrait c={v.character} height="100%" round={0} w={192} /></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{v.character.name.split(" ")[0]}</div>
                <div className="muted" style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.last.role === "user" ? "You: " : ""}{v.last.content}</div>
              </div>
            </Link>
          ))}
        </aside>

        <section className="center" style={{ position: "relative" }}>
          <div className="head">
            <Link href="/" className="muted" style={{ fontSize: 20 }}>←</Link>
            {c && <>
              <div className="avatar-sm" onClick={() => setShowProfile(true)} style={{ cursor: "pointer" }}><Portrait c={c} height="100%" round={0} w={192} /></div>
              <div onClick={() => setShowProfile(true)} style={{ cursor: "pointer" }}>
                <div style={{ fontWeight: 800 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "#2ee67a" }}>● Online{lvl && <span style={{ color: "var(--pink)", marginLeft: 8 }}>{lvl.emoji} {lvl.name}</span>}</div>
              </div>
              <div className="head-actions">
                {wallet && <Link href="/premium" className="credits" title="Your credits">💎 {wallet.balance}</Link>}
                {mediaOn && <button className="hbtn" title="Ask for a photo" onClick={() => void requestMedia("image")}>📸</button>}
                <button className="hbtn" title="Her profile" onClick={() => setShowProfile(true)}>♡</button>
              </div>
            </>}
          </div>
          {lvl && lvl.nextAt !== null && (
            <div title={`${lvl.nextAt - lvl.messages} more messages to become her ${lvl.nextName}`} style={{ height: 4, background: "var(--panel2)" }}>
              <div style={{ height: 4, width: `${Math.min(100, ((lvl.messages - lvl.at) / (lvl.nextAt - lvl.at)) * 100)}%`, background: "var(--grad)", transition: "width .4s" }} />
            </div>
          )}
          {levelUp && <div style={{ position: "absolute", left: "50%", top: 90, transform: "translateX(-50%)", zIndex: 5 }} className="pill gold">{levelUp}</div>}
          {c && <div className="chat-bg" aria-hidden><Portrait c={c} height="100%" round={0} w={192} /></div>}
          <div className="msgs">
            {c && (
              <div className="chat-intro">
                <div className="ring"><Portrait c={c} height="100%" round={999} /></div>
                <b>{c.name.split(" ")[0]}, {c.age}</b>
                <span className="muted">{c.tagline || "Say hi, she's been waiting…"}</span>
              </div>
            )}
            {lines.map((l, i) => (
              <div key={i} className={`mrow ${l.who}`}>
              {l.who === "them" && c && <div className="mav"><Portrait c={c} height="100%" round={999} /></div>}
              <div className={`bubble ${l.who}`}>
                {l.image === "locked" && c && (
                  <button className="locked-pic" onClick={() => setPaywall(true)} aria-label="Unlock her photo">
                    <div className="blur"><Portrait c={c} height="100%" round={0} w={192} /></div>
                    <span className="lp-lock">🔒<b>Tap to unlock</b></span>
                  </button>
                )}
                {l.image && l.image !== "locked" && c && (
                  <div style={{ width: 210, aspectRatio: "3/4", borderRadius: 14, overflow: "hidden", marginBottom: 6, position: "relative" }}>
                    {l.image === "clip" && c.clipV ? <ClipVideo src={`/api/portraits/${c.id}/clip?v=${c.clipV}`} className="clip" /> : <Portrait c={c} height="100%" round={0} />}
                  </div>
                )}
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
              </div>
            ))}
            {typing && c && <div className="mrow them"><div className="mav"><Portrait c={c} height="100%" round={999} /></div><div className="bubble them dots" aria-label={`${c.name.split(" ")[0]} is typing`}><i /><i /><i /></div></div>}
            <div ref={bottom} />
          </div>
          {wallet && !wallet.premium && wallet.balance > 0 && wallet.balance <= 3 && c && (
            <div className="low-credits">
              <span>⏳ <b>{wallet.balance} free {wallet.balance === 1 ? "message" : "messages"} left</b> with {c.name.split(" ")[0]}</span>
              <Link href="/premium" className="btn btn-gold btn-sm">Go Premium</Link>
            </div>
          )}
          {!typing && lines.length < 40 && (
            <div className="quick">
              {QUICK.map((q) => <button key={q} onClick={() => void send(q)}>{q}</button>)}
            </div>
          )}
          {paywall && c && (
            <div className="backdrop" onClick={() => setPaywall(false)}>
              <div className="modal paywall" onClick={(e) => e.stopPropagation()}>
                <div className="pw-ring"><Portrait c={c} height="100%" round={999} w={192} /></div>
                {wallet?.premium ? (<>
                  <h2>Out of credits</h2>
                  <p className="muted">{c.name.split(" ")[0]} is still waiting for your reply. Top up to keep chatting: 1 credit per message.</p>
                  <Link href="/premium#credits" className="btn btn-gold" style={{ width: "100%" }}>Buy credits</Link>
                </>) : (<>
                  <h2>Don&apos;t leave her hanging…</h2>
                  <p className="muted">You&apos;ve used your free messages. Go Premium to keep chatting with {c.name.split(" ")[0]}: monthly credits, voice notes, photos and her private gallery.</p>
                  <Link href="/premium" className="btn btn-gold" style={{ width: "100%" }}>Get Premium · up to 70% off</Link>
                </>)}
                <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => setPaywall(false)}>Maybe later</button>
              </div>
            </div>
          )}
          <div className="composer">
            {mediaOn && <button className="cbtn" title="Ask for a photo" aria-label="Ask for a photo" onClick={() => void requestMedia("image")}>📷</button>}
            <input className="field" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void send()} placeholder={c ? `${t("message")} ${c.name.split(" ")[0]}…` : ""} />
            <button className="send" aria-label={t("send")} onClick={() => void send()} disabled={typing || !input.trim()}>➤</button>
          </div>
        </section>

        <aside className="profile">
          {c && <>
            <button className="btn btn-ghost btn-sm" style={{ marginBottom: 10 }} onClick={() => setShowProfile(false)}>✕</button>
            <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "3/4", position: "relative" }}><Portrait c={c} height="100%" round={0} /></div>
            <PrivateGallery c={c} />
            <h2 style={{ margin: "14px 0 2px" }}>{c.name}, {c.age}</h2>
            <p style={{ margin: "0 0 12px", color: "#d9d9e3" }}>{c.tagline}</p>
            {pushState === "off" && <button className="btn btn-sm" style={{ width: "100%", margin: "4px 0 12px" }} onClick={() => void enablePush()}>🔔 Get notified when {c.name.split(" ")[0]} texts</button>}
            {pushState === "on" && <p className="muted" style={{ fontSize: 13 }}>🔔 Notifications on</p>}
            <div className="chips" style={{ flexWrap: "wrap" }}>
              {[c.occupation, c.personality, c.ethnicity, c.outfit].filter(Boolean).map((x) => <span key={x} className="chip">{pretty(x!)}</span>)}
            </div>
            {fans && fans.top.length > 0 && (
              <div style={{ marginTop: 16, background: "var(--panel2)", borderRadius: 14, padding: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>🏆 {c.name.split(" ")[0]}'s top fans this week</div>
                {fans.top.map((f) => (
                  <div key={f.rank} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "3px 0", color: f.you ? "var(--pink)" : undefined, fontWeight: f.you ? 800 : 400 }}>
                    <span>{["🥇", "🥈", "🥉"][f.rank - 1] ?? `#${f.rank}`} {f.you ? "You" : f.handle}</span><span className="muted">{f.messages} msgs</span>
                  </div>
                ))}
                {fans.yourRank && fans.yourRank > fans.top.length && <div style={{ fontSize: 13, marginTop: 4 }} className="muted">You're #{fans.yourRank}. Keep chatting to climb 😏</div>}
              </div>
            )}
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

type GalItem = { id: string; kind: "image" | "video"; url?: string };

/** Her extra photos and videos: open for Premium, blurred and locked for everyone else. */
function PrivateGallery({ c }: { c: CharacterCard }) {
  const [g, setG] = useState<{ unlocked: boolean; items: GalItem[] } | null>(null);
  const [view, setView] = useState<GalItem | null>(null);
  useEffect(() => { void fetch(`/api/gallery?c=${c.id}`).then((r) => r.json()).then(setG); }, [c.id]);
  if (!g?.items.length) return null;
  const photos = g.items.filter((i) => i.kind === "image").length;
  const videos = g.items.length - photos;
  return (
    <div className="pgal">
      <div className="pgal-head"><b>{g.unlocked ? "Her private gallery" : "🔒 Her private gallery"}</b><span className="muted">{photos} photos · {videos} videos</span></div>
      <div className="pgal-grid">
        {g.items.map((i) => g.unlocked && i.url ? (
          <button key={i.id} className="pgal-tile" onClick={() => setView(i)} aria-label={`Open ${i.kind}`}>
            {i.kind === "video" ? <video src={i.url} muted playsInline preload="metadata" /> : <img src={i.url} alt={`${c.name} (AI-generated)`} loading="lazy" />}
            {i.kind === "video" && <span className="pgal-play">▶</span>}
          </button>
        ) : (
          <Link key={i.id} href="/premium" className="pgal-tile locked" aria-label="Unlock with Premium">
            <div className="blur"><Portrait c={c} height="100%" round={0} w={192} /></div>
            <span className="pgal-lock">🔒<small>{i.kind === "video" ? "Video" : "Photo"}</small></span>
          </Link>
        ))}
      </div>
      {!g.unlocked && <Link href="/premium" className="btn btn-gold" style={{ width: "100%", marginTop: 10 }}>Unlock all with Premium</Link>}
      {view?.url && (
        <div className="backdrop" onClick={() => setView(null)}>
          <div className="pgal-view" onClick={(e) => e.stopPropagation()}>
            {view.kind === "video" ? <video src={view.url} controls autoPlay playsInline /> : <img src={view.url} alt={`${c.name} (AI-generated)`} />}
            <button className="hbtn" aria-label="Close" onClick={() => setView(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

const QUICK = ["Hey gorgeous", "How was your day?", "Tell me a secret", "Kya kar rahi ho?", "I missed you"];

export default function ChatPage() {
  return <Suspense><Chat /></Suspense>;
}
