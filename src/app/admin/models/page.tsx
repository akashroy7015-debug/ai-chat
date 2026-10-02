"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { btn, field, pretty, Portrait, theme } from "../../ui";
import { OPTIONS, type OptionKey } from "../../character-options";

type Model = Record<OptionKey, string> & {
  id: string; name: string; age: number; tagline: string; backstory: string; hobbies: string[]; hidden?: boolean; portraitV?: number; clipV?: number;
};

const BLANK = {
  gender: "female", style: "photoreal", ethnicity: "latina", hair: "black", hairStyle: "wavy", eyes: "brown", build: "curvy",
  bodyShape: "hourglass", bust: "large", hips: "wide", outfit: "bodycon_dress", personality: "confident", voice: "husky",
  relationship: "girlfriend", occupation: "fitness_coach", name: "", age: 25, tagline: "", backstory: "", hobbies: "",
};
type Form = typeof BLANK & Record<string, string | number>;

/** Copies only the editable fields of a model into the form. */
function toForm(m: Model): Form {
  const f: Form = { ...BLANK };
  for (const k of Object.keys(BLANK) as (keyof typeof BLANK)[]) {
    const v = (m as unknown as Record<string, unknown>)[k];
    if (typeof v === "string" || typeof v === "number") (f as Record<string, string | number>)[k] = v;
  }
  f.hobbies = m.hobbies.join(", ");
  return f;
}

const card = { background: theme.card, borderRadius: 12, padding: 10 } as const;
const small = { ...btn, padding: "5px 10px", fontSize: 12 } as const;

export default function Models() {
  const [models, setModels] = useState<Model[] | null>(null);
  const [err, setErr] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [galV, setGalV] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; name: string; at: number }[]>([]);
  const loadPending = async () => { const r = await fetch("/api/admin/pending"); if (r.ok) setPending((await r.json()).pending); };
  useEffect(() => { void loadPending(); }, []);
  async function review(id: string, approve: boolean) {
    if (approve && !confirm("Approve: this is clearly an ADULT (looks 21+), is not a real person, and has no nudity?")) return;
    await fetch("/api/admin/pending", { method: "POST", body: JSON.stringify({ id, approve }) });
    await loadPending(); await load();
  }

  async function load() {
    const r = await fetch("/api/admin/characters");
    if (!r.ok) return setErr(r.status === 404 ? "Admins only." : (await r.json()).error);
    setModels((await r.json()).characters);
  }
  useEffect(() => { void load(); }, []);

  async function act(body: Record<string, unknown>) {
    const r = await fetch("/api/admin/characters", { method: "POST", body: JSON.stringify(body) });
    const b = await r.json();
    if (!r.ok) { alert(b.error); return null; }
    return b;
  }

  async function save() {
    if (!form) return;
    const character = { ...form, age: Number(form.age), hobbies: String(form.hobbies).split(",").map((h) => h.trim()).filter(Boolean) };
    setBusy("save");
    const b = await act(editId ? { action: "update", id: editId, character } : { action: "create", character });
    if (b && !editId && b.character && confirm("Model created. Generate the picture now? (~$0.05 OpenAI credit)")) {
      setBusy(b.character.id);
      await act({ action: "portrait", id: b.character.id });
    }
    setBusy(null);
    if (b) { setForm(null); setEditId(null); await load(); }
  }

  async function picture(id: string) {
    setBusy(id);
    await act({ action: "portrait", id });
    setBusy(null);
    await load(); await loadPending();
  }

  async function upload(id: string, file: File | undefined) {
    if (!file) return;
    if (!confirm("Confirm: this picture shows a FICTIONAL ADULT (AI-generated), not a real person, and you have the right to use it.")) return;
    setBusy(id);
    const fd = new FormData();
    fd.append("id", id);
    fd.append("file", file);
    const r = await fetch("/api/admin/characters/upload", { method: "POST", body: fd });
    setBusy(null);
    if (!r.ok) alert((await r.json()).error);
    await load();
  }

  async function uploadVideo(id: string, file: File | undefined, remove = false) {
    if (!remove && !file) return;
    if (!remove && !confirm("Confirm: this video shows a FICTIONAL ADULT (AI-generated), not a real person, no nudity, and you have the right to use it.")) return;
    setBusy(id);
    const fd = new FormData();
    fd.append("id", id);
    if (remove) fd.append("remove", "1"); else fd.append("file", file!);
    const r = await fetch("/api/admin/characters/clip", { method: "POST", body: fd });
    setBusy(null);
    if (!r.ok) alert((await r.json()).error);
    await load();
  }

  async function uploadGallery(id: string, files: FileList | null) {
    if (!files?.length) return;
    if (!confirm(`Confirm: these ${files.length} file(s) show a FICTIONAL ADULT (AI-generated), not a real person, no nudity, and you have the right to use them.`)) return;
    setBusy(id);
    const fd = new FormData();
    fd.append("id", id);
    for (const f of Array.from(files)) fd.append("file", f);
    const r = await fetch("/api/admin/gallery", { method: "POST", body: fd });
    const b = await r.json();
    setBusy(null);
    if (b.errors?.length) alert(b.errors.join("\n"));
    setGalV((v) => v + 1);
  }

  async function post(id: string, name: string) {
    const text = prompt(`New Discover post from ${name}:`);
    if (!text) return;
    const r = await fetch("/api/admin/posts", { method: "POST", body: JSON.stringify({ characterId: id, text }) });
    alert(r.ok ? "Posted to Discover." : (await r.json()).error);
  }

  if (err) return <main><h1>Models</h1><p style={{ color: "#ff8a8a" }}>{err}</p></main>;

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <h1>Models <span style={{ color: theme.muted, fontSize: 16 }}>({models?.length ?? "…"})</span></h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/admin"><button style={{ ...btn, background: "#333" }}>← Admin</button></Link>
          <button style={btn} onClick={() => { setForm({ ...BLANK }); setEditId(null); }}>+ New model</button>
        </div>
      </div>
      <p style={{ color: theme.muted, fontSize: 13 }}>Fictional adults only (18+). Names or looks of real people are blocked. Pictures are generated fully clothed.</p>

      {pending.length > 0 && (
        <section style={{ ...card, margin: "12px 0", border: "2px solid #e0a060" }}>
          <h3 style={{ marginTop: 0 }}>⏳ Waiting for your approval ({pending.length})</h3>
          <p style={{ color: theme.muted, fontSize: 13, marginTop: 0 }}>Reject anything that looks under 21, looks like a real person, or shows nudity.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
            {pending.map((p) => (
              <div key={p.id}>
                <img src={`/api/admin/pending/${p.id}?t=${p.at}`} alt={p.name} style={{ width: "100%", borderRadius: 8 }} />
                <div style={{ fontSize: 13, margin: "4px 0" }}>{p.name}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button style={{ ...small, background: "#2a7" }} onClick={() => void review(p.id, true)}>Approve</button>
                  <button style={{ ...small, background: "#a33" }} onClick={() => void review(p.id, false)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {form && (
        <section style={{ ...card, margin: "12px 0", display: "grid", gap: 8 }}>
          <h3 style={{ margin: 0 }}>{editId ? "Edit model" : "New model"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
            <label>Name<input style={{ ...field, width: "100%" }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>Age (18+)<input style={{ ...field, width: "100%" }} type="number" min={18} max={99} value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} /></label>
            {(Object.keys(OPTIONS) as OptionKey[]).map((k) => (
              <label key={k}>{pretty(k)}
                <select style={{ ...field, width: "100%" }} value={String(form[k])} onChange={(e) => setForm({ ...form, [k]: e.target.value })}>
                  {OPTIONS[k].map((o) => <option key={o} value={o}>{pretty(o)}</option>)}
                </select>
              </label>
            ))}
          </div>
          <input style={field} placeholder="Tagline (shown on the card)" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
          <input style={field} placeholder="Hobbies, comma separated" value={String(form.hobbies)} onChange={(e) => setForm({ ...form, hobbies: e.target.value })} />
          <textarea style={field} rows={3} placeholder="Backstory (shapes how she talks)" value={form.backstory} onChange={(e) => setForm({ ...form, backstory: e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btn} disabled={!!busy} onClick={() => void save()}>{busy ? "Saving…" : editId ? "Save changes" : "Create model"}</button>
            <button style={{ ...btn, background: "#333" }} onClick={() => { setForm(null); setEditId(null); }}>Cancel</button>
          </div>
        </section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
        {models?.map((m) => (
          <div key={m.id} style={{ ...card, opacity: m.hidden ? 0.5 : 1 }}>
            <Portrait key={m.portraitV} c={m} height={260} />
            <div style={{ padding: "6px 2px" }}>
              <b>{m.name}</b> <span style={{ color: theme.muted }}>{m.age}</span> {m.hidden && <span style={{ color: "#ff8a8a", fontSize: 12 }}>HIDDEN</span>}
              <div style={{ fontSize: 12, color: theme.muted }}>{pretty(m.ethnicity)} · {pretty(m.bodyShape)} · {pretty(m.outfit)}</div>
            </div>
            <GalleryAdmin id={m.id} v={galV} />
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              <button style={small} onClick={() => { setEditId(m.id); setForm(toForm(m)); window.scrollTo(0, 0); }}>Edit</button>
              <button style={{ ...small, background: "#c94a6e" }} disabled={busy === m.id} onClick={() => void picture(m.id)}>{busy === m.id ? "Creating…" : m.portraitV ? "New picture" : "Picture"}</button>
              <label style={{ ...small, background: "#0a7", display: "inline-block", cursor: "pointer" }}>
                ⬆ Upload
                <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => void upload(m.id, e.target.files?.[0])} />
              </label>
              <label style={{ ...small, background: "#0a7", display: "inline-block", cursor: "pointer" }}>
                🎬 Video
                <input type="file" accept="video/mp4,video/webm" hidden onChange={(e) => void uploadVideo(m.id, e.target.files?.[0])} />
              </label>
              <label style={{ ...small, background: "#b8860b", display: "inline-block", cursor: "pointer" }}>
                🔒 Premium
                <input type="file" multiple accept="image/png,image/jpeg,image/webp,video/mp4,video/webm" hidden onChange={(e) => { void uploadGallery(m.id, e.target.files); e.target.value = ""; }} />
              </label>
              {m.clipV && <button style={{ ...small, background: "#333" }} onClick={() => void uploadVideo(m.id, undefined, true)}>✕ Video</button>}
              <button style={{ ...small, background: "#333" }} onClick={() => void post(m.id, m.name)}>Post</button>
              <button style={{ ...small, background: m.hidden ? "#2a7" : "#a33" }} onClick={async () => { await act({ action: m.hidden ? "show" : "hide", id: m.id }); void load(); }}>{m.hidden ? "Show" : "Hide"}</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

/** Thumbnails of a model's Premium gallery, each removable. */
function GalleryAdmin({ id, v }: { id: string; v: number }) {
  const [items, setItems] = useState<{ id: string; kind: string; url?: string }[]>([]);
  const [n, setN] = useState(0);
  useEffect(() => { void fetch(`/api/gallery?c=${id}`).then((r) => r.json()).then((b) => setItems(b.items)); }, [id, v, n]);
  if (!items.length) return null;
  async function remove(item: string) {
    if (!confirm("Remove this file from her Premium gallery?")) return;
    const fd = new FormData();
    fd.append("remove", item);
    await fetch("/api/admin/gallery", { method: "POST", body: fd });
    setN((k) => k + 1);
  }
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", margin: "0 0 6px" }} title="Premium gallery">
      {items.map((i) => (
        <div key={i.id} style={{ position: "relative", width: 40, height: 52, borderRadius: 6, overflow: "hidden", background: "#222" }}>
          {i.kind === "video" ? <video src={i.url} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <img src={i.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          <button aria-label="Remove" onClick={() => void remove(i.id)} style={{ position: "absolute", top: 0, right: 0, border: 0, background: "rgba(0,0,0,.7)", color: "#fff", fontSize: 10, cursor: "pointer", padding: "1px 4px" }}>✕</button>
        </div>
      ))}
    </div>
  );
}
