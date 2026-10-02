"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND, pretty, Portrait, type CharacterCard } from "./ui";
import { AuthModal } from "./auth-panel";
import { LangSwitch, useT } from "./i18n";

const CATEGORIES = ["girls", "milf", "anime", "guys"] as const;
const FILTERS: [group: "ethnicity" | "hair" | "ageRange", value: string, label: string][] = [
  ["ethnicity", "caucasian", "Caucasian"], ["ethnicity", "latina", "Latina"], ["ethnicity", "asian", "Asian"],
  ["ethnicity", "arab", "Arab"], ["ethnicity", "african", "African"], ["ethnicity", "south_asian", "Indian"],
  ["hair", "blonde", "Blonde"], ["hair", "brown", "Brunette"], ["hair", "black", "Black hair"], ["hair", "red", "Redhead"],
  ["ageRange", "20s", "20s"], ["ageRange", "30s", "30s"], ["ageRange", "40plus", "40+"],
];

const FAQ = [
  ["What is this?", "A place to chat with AI companions who remember you, flirt back, send voice messages and keep the conversation going. Every character is a fictional adult created by AI."],
  ["Is it private?", "Your chats are private to your account. We never sell your data, and you can ask us to delete everything at any time."],
  ["Why do I need to verify my age?", "Our companions are for adults only. A quick ID check keeps the platform 18+ and safe for everyone."],
  ["Can I create my own character?", "Yes. Pick her looks, body type, outfit, personality and voice, and she's ready to chat in seconds."],
  ["Does it speak Hindi?", "Yes. Write in English, Hindi or Hinglish and your companion replies in the same language."],
];

type Me = { email?: string; premium?: boolean; admin?: boolean; ageStatus?: string; balance?: number } | null | undefined;

export default function Home() {
  const { t } = useT();
  const router = useRouter();
  const [me, setMe] = useState<Me>(undefined);
  const [auth, setAuth] = useState<null | "login" | "register">(null);
  const [category, setCategory] = useState<string>("girls");
  const [f, setF] = useState<{ ethnicity: string; hair: string; ageRange: string }>({ ethnicity: "", hair: "", ageRange: "" });
  const [chars, setChars] = useState<CharacterCard[] | null>(null);

  async function refresh() {
    const r = await fetch("/api/auth/me");
    setMe(r.ok ? await r.json() : null);
  }
  useEffect(() => { void refresh(); }, []);

  useEffect(() => {
    const q = new URLSearchParams({ category, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) });
    void fetch(`/api/characters/featured?${q}`).then((r) => r.json()).then((b) => setChars(b.characters));
  }, [category, f]);

  async function verify() {
    await fetch("/api/verify-age", { method: "POST", body: JSON.stringify({}) });
    // Dev mock: completes instantly. A real provider redirects to its hosted flow, then calls back.
    await fetch("/api/verify-age", { method: "POST", body: JSON.stringify({ action: "complete" }) });
    await refresh();
  }

  const verified = me?.ageStatus === "verified";
  function open(id: string) {
    if (!me) return setAuth("register");
    if (!verified) return void verify().then(() => router.push(`/chat?c=${id}`));
    router.push(`/chat?c=${id}`);
  }

  return (
    <main>
      <header className="topbar">
        <div className="tabs">
          {CATEGORIES.map((v) => <button key={v} className={`tab ${category === v ? "on" : ""}`} onClick={() => setCategory(v)}>{t(v)}</button>)}
        </div>
        <div className="right">
          {me?.admin && <Link href="/admin" className="pill">⚙️ Admin</Link>}
          {me && <Link href="/premium" className="pill">💎 {me.balance ?? 0}</Link>}
          <span className="sm-only"><LangSwitch /></span>
          {me?.premium ? <span className="pill gold">👑<span className="hide-sm"> Premium</span></span> : <Link href="/premium" className="btn btn-sm">👑<span className="hide-sm"> Premium -70%</span></Link>}
          {me === null && <button className="btn btn-sm btn-ghost" onClick={() => setAuth("login")}>{t("login")}</button>}
        </div>
      </header>

      <section className="hero">
        <div>
          <h1>Your AI girlfriend <span>is waiting</span></h1>
          <p>Flirty, playful and always there for you. She remembers everything, sends voice notes and talks in English, Hindi or Hinglish.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {me ? (verified ? <a href="#models" className="btn">💬 Start chatting</a> : <button className="btn" onClick={() => void verify()}>✅ {t("verify")}</button>)
              : <button className="btn" onClick={() => setAuth("register")}>✨ {t("signup")}</button>}
            <Link href="/create" className="btn btn-ghost">➕ {t("create")}</Link>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>{t("tagline")}</p>
        </div>
        <div className="stack">
          {(chars ?? []).slice(0, 3).map((c) => <div key={c.id}><Portrait c={c} height="100%" round={0} /></div>)}
        </div>
      </section>

      <div className="chips" style={{ marginBottom: 18 }}>
        {FILTERS.map(([g, v, label]) => (
          <button key={g + v} className={`chip ${f[g] === v ? "on" : ""}`} onClick={() => setF({ ...f, [g]: f[g] === v ? "" : v })}>{label}</button>
        ))}
      </div>

      <h2 id="models" style={{ margin: "0 0 14px" }}>🔥 {t("explore")}</h2>
      {chars?.length === 0 && <p className="muted">No characters match these filters.</p>}
      <div className="grid">
        {(chars ?? []).map((c, i) => (
          <div key={c.id} className="card" onClick={() => open(c.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && open(c.id)}>
            <div className="img"><Portrait c={c} height="100%" round={0} /></div>
            <div className="shade" />
            {i < 3 && <span className="badge">🔥 HOT</span>}
            <span className="online" title="Online" />
            <div className="info">
              <div className="name">{c.name.split(" ")[0]}<small>{c.age}</small></div>
              <div className="tag">{c.tagline || `${pretty(c.occupation)} · ${pretty(c.personality)}`}</div>
            </div>
            <div className="cta"><span className="btn" style={{ width: "100%" }}>💬 {t("chatWith")} {c.name.split(" ")[0]}</span></div>
          </div>
        ))}
      </div>

      <section className="faq">
        <h2 style={{ margin: "0 0 6px" }}>FAQ</h2>
        {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
      </section>

      <footer className="muted" style={{ margin: "32px 0 16px", fontSize: 12, lineHeight: 1.7 }}>
        © {new Date().getFullYear()} {BRAND}. All characters and media are AI-generated and fictional. 18+ only.{" "}
        <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/grievance">Grievances</Link>
      </footer>

      {auth && <AuthModal mode={auth} onClose={() => setAuth(null)} onDone={() => { setAuth(null); void refresh(); }} />}
    </main>
  );
}
