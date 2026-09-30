"use client";
import { useEffect, useState } from "react";

interface Character { id: string; name: string; age: number }
interface Line { who: "you" | "her"; text: string }

const OPTIONS = {
  hair: ["black", "brown", "blonde", "red", "auburn", "silver", "pink", "blue"],
  eyes: ["brown", "blue", "green", "hazel", "gray"],
  build: ["slim", "athletic", "curvy", "average", "tall", "petite"],
  style: ["photoreal", "anime"],
  personality: ["bubbly", "calm", "cheeky", "nurturing", "intellectual", "adventurous", "shy"],
} as const;

const field = { padding: 8, borderRadius: 6, border: "1px solid #333", background: "#1a1a22", color: "#eee" } as const;
const btn = { padding: "8px 14px", borderRadius: 8, border: "none", background: "#e0457b", color: "#fff", cursor: "pointer" } as const;

export default function ChatPage() {
  const [chars, setChars] = useState<Character[]>([]);
  const [active, setActive] = useState<Character | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", age: 25, hair: "brown", eyes: "green", build: "slim", style: "photoreal", personality: "calm", backstory: "" });

  async function load() {
    const r = await fetch("/api/characters");
    if (r.ok) setChars((await r.json()).characters);
    else setErr((await r.json()).error);
  }
  useEffect(() => { void load(); }, []);

  async function create() {
    setErr("");
    const r = await fetch("/api/characters", { method: "POST", body: JSON.stringify({ ...form, hobbies: [] }) });
    const body = await r.json();
    if (!r.ok) return setErr((body.issues ?? [body.error]).join(", "));
    setActive(body.character);
    await load();
  }

  async function send() {
    if (!active || !input.trim()) return;
    const text = input;
    setInput("");
    setLines((l) => [...l, { who: "you", text }]);
    const r = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ characterId: active.id, message: text }) });
    const body = await r.json();
    setLines((l) => [...l, { who: "her", text: body.message ?? body.error }]);
  }

  return (
    <main>
      <h1>Chat</h1>
      {err && <p style={{ color: "#ff8a8a" }}>{err}</p>}
      {!active ? (
        <>
          <h2>Your characters</h2>
          {chars.map((c) => <button key={c.id} style={{ ...btn, marginRight: 8 }} onClick={() => { setActive(c); setLines([]); }}>{c.name} ({c.age})</button>)}
          <h2>Create a character</h2>
          <p style={{ opacity: 0.7 }}>Fictional adults only (18+). Real people and likenesses are not allowed.</p>
          <div style={{ display: "grid", gap: 8 }}>
            <input style={field} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input style={field} type="number" min={18} value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} />
            {(Object.keys(OPTIONS) as (keyof typeof OPTIONS)[]).map((k) => (
              <select key={k} style={field} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}>
                {OPTIONS[k].map((o) => <option key={o}>{o}</option>)}
              </select>
            ))}
            <textarea style={field} placeholder="Backstory (optional)" value={form.backstory} onChange={(e) => setForm({ ...form, backstory: e.target.value })} />
            <button style={btn} onClick={create}>Create</button>
          </div>
        </>
      ) : (
        <>
          <h2>{active.name} <button style={{ ...btn, background: "#333", fontSize: 12 }} onClick={() => setActive(null)}>Back</button></h2>
          <div style={{ minHeight: 240 }}>
            {lines.map((l, i) => <p key={i} style={{ textAlign: l.who === "you" ? "right" : "left" }}><b>{l.who === "you" ? "You" : active.name}:</b> {l.text}</p>)}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...field, flex: 1 }} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void send()} placeholder="Say something…" />
            <button style={btn} onClick={send}>Send</button>
          </div>
        </>
      )}
    </main>
  );
}
