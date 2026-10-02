"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { btn, chip, field, pretty, Portrait, theme } from "../ui";

const O = {
  gender: ["female", "male"],
  style: ["photoreal", "anime"],
  ethnicity: ["caucasian", "latina", "asian", "arab", "african", "south_asian", "mixed"],
  hair: ["black", "brown", "blonde", "red", "auburn", "silver", "pink", "blue"],
  hairStyle: ["straight", "wavy", "curly", "bangs", "ponytail", "bun", "short", "braids"],
  eyes: ["brown", "blue", "green", "hazel", "gray"],
  build: ["slim", "athletic", "curvy", "average", "muscular", "tall"],
  bodyShape: ["hourglass", "curvy", "athletic", "slim", "pear", "muscular", "plus_size"],
  bust: ["small", "medium", "large", "extra_large"],
  hips: ["slim", "medium", "wide", "extra_wide"],
  outfit: ["short_dress", "bodycon_dress", "cocktail_dress", "evening_gown", "crop_top_skirt", "bikini", "office_wear", "casual", "gym_wear", "bralette_top", "night_dress", "oversized_shirt"],
  personality: ["bubbly", "calm", "cheeky", "nurturing", "intellectual", "adventurous", "shy", "confident", "mysterious"],
  voice: ["soft", "warm", "playful", "deep", "confident", "husky"],
  relationship: ["girlfriend", "boyfriend", "friend", "crush", "partner", "flirty_stranger"],
  occupation: ["nurse", "artist", "musician", "chef", "photographer", "fitness_coach", "barista", "architect", "pilot", "lawyer", "writer", "firefighter"],
} as const;
type Key = keyof typeof O;

const STEPS: { title: string; keys: Key[] }[] = [
  { title: "Style", keys: ["gender", "style"] },
  { title: "Looks", keys: ["ethnicity", "hair", "hairStyle", "eyes", "build"] },
  { title: "Body & outfit", keys: ["bodyShape", "bust", "hips", "outfit"] },
  { title: "Personality", keys: ["personality", "voice", "relationship", "occupation"] },
];

export default function Create() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [f, setF] = useState<Record<Key, string> & { name: string; age: number; hobbies: string; tagline: string; backstory: string }>({
    gender: "female", style: "photoreal", ethnicity: "caucasian", hair: "brown", hairStyle: "wavy", eyes: "green", build: "athletic", bodyShape: "hourglass", bust: "large", hips: "wide", outfit: "short_dress",
    personality: "calm", voice: "warm", relationship: "girlfriend", occupation: "artist",
    name: "", age: 25, hobbies: "", tagline: "", backstory: "",
  });
  const last = step === STEPS.length;

  async function submit() {
    setErr("");
    const body = { ...f, hobbies: f.hobbies.split(",").map((h) => h.trim()).filter(Boolean) };
    const r = await fetch("/api/characters", { method: "POST", body: JSON.stringify(body) });
    const b = await r.json();
    if (!r.ok) return setErr((b.issues ?? [b.error]).join(", "));
    router.push(`/chat?c=${b.character.id}`);
  }

  return (
    <main>
      <h1>Create your character</h1>
      <p style={{ color: theme.muted }}>Fictional adults only (18+). Real people and lookalikes aren&apos;t allowed. Photo uploads are not supported.</p>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[...STEPS.map((s) => s.title), "Details"].map((t, i) => <span key={t} style={chip(i === step)}>{i + 1}. {t}</span>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16 }}>
        <Portrait c={{ ...f, name: f.name || "?" }} height={240} />
        <div>
          {!last ? STEPS[step].keys.map((k) => (
            <section key={k} style={{ marginBottom: 12 }}>
              <div style={{ color: theme.muted, fontSize: 13, marginBottom: 6 }}>{pretty(k)}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {O[k].map((o) => <button key={o} style={chip(f[k] === o)} onClick={() => setF({ ...f, [k]: o })}>{pretty(o)}</button>)}
              </div>
            </section>
          )) : (
            <div style={{ display: "grid", gap: 8 }}>
              <input style={field} placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <label style={{ color: theme.muted, fontSize: 13 }}>Age (18+)
                <input style={{ ...field, width: "100%" }} type="number" min={18} max={99} value={f.age} onChange={(e) => setF({ ...f, age: Number(e.target.value) })} />
              </label>
              <input style={field} placeholder="Hobbies, comma separated" value={f.hobbies} onChange={(e) => setF({ ...f, hobbies: e.target.value })} />
              <input style={field} placeholder="Tagline (e.g. Always chasing golden hour.)" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} />
              <textarea style={field} placeholder="Backstory (optional)" value={f.backstory} onChange={(e) => setF({ ...f, backstory: e.target.value })} />
            </div>
          )}
          {err && <p style={{ color: "#ff8a8a" }}>{err}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {step > 0 && <button style={{ ...btn, background: "#333" }} onClick={() => setStep(step - 1)}>Back</button>}
            {!last ? <button style={btn} onClick={() => setStep(step + 1)}>Next</button> : <button style={btn} onClick={submit}>Create &amp; chat</button>}
          </div>
        </div>
      </div>
    </main>
  );
}
