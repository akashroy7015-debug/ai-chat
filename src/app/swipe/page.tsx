"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipVideo, pretty, Portrait, type CharacterCard } from "../ui";

/** Tinder-style: swipe right to match and chat, left to skip. */
export default function Swipe() {
  const router = useRouter();
  const [deck, setDeck] = useState<CharacterCard[]>([]);
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [match, setMatch] = useState<CharacterCard | null>(null);
  const start = useRef<number | null>(null);

  useEffect(() => {
    void Promise.all(["girls", "milf", "anime"].map((c) => fetch(`/api/characters/featured?category=${c}`).then((r) => r.json())))
      .then((rs) => setDeck(rs.flatMap((r) => r.characters).sort(() => Math.random() - 0.5)));
  }, []);

  const c = deck[i];
  function decide(like: boolean) {
    if (!c) return;
    setDx(0);
    if (like) setMatch(c);
    setI(i + 1);
  }

  return (
    <main style={{ maxWidth: 440, margin: "0 auto", paddingTop: 16 }}>
      <h1 style={{ margin: "0 0 12px" }}>💘 Swipe</h1>
      {!c ? (
        <div className="muted" style={{ textAlign: "center", padding: 40 }}>
          You've seen everyone 😍 <br /><br /><button className="btn" onClick={() => setI(0)}>Start again</button>
        </div>
      ) : (
        <>
          <div className="card" style={{ aspectRatio: "3/4.3", transform: `translateX(${dx}px) rotate(${dx / 18}deg)`, transition: start.current === null ? "transform .25s" : "none", touchAction: "pan-y" }}
            onPointerDown={(e) => { start.current = e.clientX; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
            onPointerMove={(e) => { if (start.current !== null) setDx(e.clientX - start.current); }}
            onPointerUp={() => { const d = dx; start.current = null; if (d > 110) decide(true); else if (d < -110) decide(false); else setDx(0); }}>
            <div className="img"><Portrait c={c} height="100%" round={0} /></div>
            {c.clipV && <ClipVideo className="clip" src={`/api/portraits/${c.id}/clip?v=${c.clipV}`} />}
            <div className="shade" />
            {dx > 40 && <span className="badge" style={{ left: "auto", right: 14, top: 18, fontSize: 22, color: "#2ee67a", border: "3px solid #2ee67a" }}>LIKE</span>}
            {dx < -40 && <span className="badge" style={{ top: 18, fontSize: 22, color: "#ff5c7a", border: "3px solid #ff5c7a" }}>NOPE</span>}
            <div className="info">
              <div className="name" style={{ fontSize: 26 }}>{c.name.split(" ")[0]}<small>{c.age}</small></div>
              <div style={{ fontSize: 14, color: "#ddd", margin: "4px 0" }}>{pretty(c.occupation)} · {pretty(c.personality)}</div>
              <div className="tag" style={{ fontSize: 15 }}>{c.tagline}</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 18 }}>
            <button aria-label="Skip" onClick={() => decide(false)} className="btn btn-ghost" style={{ width: 64, height: 64, fontSize: 26, padding: 0 }}>✕</button>
            <button aria-label="Like" onClick={() => decide(true)} className="btn" style={{ width: 64, height: 64, fontSize: 26, padding: 0 }}>❤️</button>
          </div>
        </>
      )}
      {match && (
        <div className="backdrop" onClick={() => setMatch(null)}>
          <div className="modal" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 32, margin: "0 0 12px", background: "var(--grad)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>It's a match! 💘</h2>
            <div style={{ width: 140, height: 180, margin: "0 auto 12px", borderRadius: 16, overflow: "hidden" }}><Portrait c={match} height="100%" round={0} /></div>
            <p>{match.name.split(" ")[0]} liked you too 😏</p>
            <div style={{ display: "grid", gap: 8 }}>
              <button className="btn" onClick={() => router.push(`/chat?c=${match.id}`)}>💬 Say hi to {match.name.split(" ")[0]}</button>
              <button className="btn btn-ghost" onClick={() => setMatch(null)}>Keep swiping</button>
            </div>
          </div>
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, textAlign: "center", marginTop: 16 }}><Link href="/">← Back to all characters</Link></p>
    </main>
  );
}
