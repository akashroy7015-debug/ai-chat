"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND, ClipVideo, Logo, pretty, Portrait, type CharacterCard } from "./ui";
import { AuthModal } from "./auth-panel";
import { LangSwitch, useT } from "./i18n";

const CATEGORIES = ["girls", "milf", "anime", "guys"] as const;
const FILTERS: [group: "ethnicity" | "hair" | "ageRange", value: string, label: string][] = [
  ["ethnicity", "caucasian", "Caucasian"], ["ethnicity", "latina", "Latina"], ["ethnicity", "asian", "Asian"],
  ["ethnicity", "arab", "Arab"], ["ethnicity", "african", "African"], ["ethnicity", "south_asian", "Indian"],
  ["hair", "blonde", "Blonde"], ["hair", "brown", "Brunette"], ["hair", "black", "Black hair"], ["hair", "red", "Redhead"],
  ["ageRange", "20s", "20s"], ["ageRange", "30s", "30s"], ["ageRange", "40plus", "40+"],
];

const SLIDES = [
  { title: "Sizzly", em: "Sale", caption: "70% OFF", action: "Join Now", href: "/premium" },
  { title: "Play with her", em: "", caption: "Flirty chats, voice notes & photos", action: "Explore Now", href: "#models" },
  { title: "Your story", em: "", caption: "Create the AI girlfriend of your dreams", action: "Create Now", href: "/create" },
];
const WEEK = 7 * 86_400_000;

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
  const [slide, setSlide] = useState(0);
  const [query, setQuery] = useState("");
  const [daily, setDaily] = useState<{ claimedToday: boolean; streak: number; reward: number } | null>(null);
  useEffect(() => { const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6000); return () => clearInterval(t); }, []);

  async function refresh() {
    const r = await fetch("/api/auth/me");
    const m = r.ok ? await r.json() : null;
    setMe(m);
    if (m?.ageStatus === "verified") void fetch("/api/daily").then((x) => (x.ok ? x.json() : null)).then((d) => d && !d.claimedToday && setDaily(d));
  }
  async function claim() {
    await fetch("/api/daily", { method: "POST" });
    setDaily(null);
    await refresh();
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
  const shown = (chars ?? []).filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));
  function open(id: string) {
    if (!me) return setAuth("register");
    if (!verified) return void verify().then(() => router.push(`/chat?c=${id}`));
    router.push(`/chat?c=${id}`);
  }

  return (
    <main>
      <header className="topbar">
        <span className="sm-only"><Logo size={22} /></span>
        <nav className="utabs">
          {CATEGORIES.map((v) => <button key={v} className={`utab ${category === v ? "on" : ""}`} onClick={() => setCategory(v)}><span className="ico">{{ girls: "♀", milf: "💋", anime: "✨", guys: "♂" }[v]}</span>{t(v)}</button>)}
        </nav>
        <div className="right">
          {me?.admin && <Link href="/admin" className="pill">⚙️ Admin</Link>}
          {me && <Link href="/premium" className="pill">💎 {me.balance ?? 0}</Link>}
          <span className="sm-only"><LangSwitch /></span>
          {me?.premium ? <span className="pill gold">👑<span className="hide-sm"> Premium</span></span> : <Link href="/premium" className="btn btn-sm">👑<span className="hide-sm"> Premium -70%</span></Link>}
          {me === null && <button className="btn btn-sm hide-sm" onClick={() => setAuth("register")}>{t("signup")}</button>}
          {me === null && <button className="btn btn-sm btn-ghost" onClick={() => setAuth("login")}>{t("login")}</button>}
        </div>
      </header>

      <section className="banner" aria-label="Offers">
        {SLIDES.map((sl, k) => (
          <div key={k} className={`slide ${slide === k ? "on" : ""}`}>
            <div className="copy">
              <h1 className="sale" style={k ? { color: "#fff", WebkitTextStroke: 0, transform: "none" } : undefined}>{sl.title}{sl.em && <em>{sl.em}</em>}</h1>
              <p className="sale-off" style={k ? { fontSize: 20, fontWeight: 600 } : undefined}>{sl.caption}</p>
              <Link href={sl.href} className="btn btn-gold">{sl.action}</Link>
            </div>
            <div className="art">
              {(chars ?? []).slice(k * 3, k * 3 + 3).map((c) => <div key={c.id}><Portrait c={c} height="100%" round={0} /></div>)}
            </div>
          </div>
        ))}
        <button className="arrow l" aria-label="Previous" onClick={() => setSlide((slide + SLIDES.length - 1) % SLIDES.length)}>‹</button>
        <button className="arrow r" aria-label="Next" onClick={() => setSlide((slide + 1) % SLIDES.length)}>›</button>
        <div className="dots">{SLIDES.map((_, k) => <button key={k} aria-label={`Slide ${k + 1}`} className={slide === k ? "on" : ""} onClick={() => setSlide(k)} />)}</div>
      </section>

      <h2 id="models" style={{ margin: "0 0 12px" }}><span style={{ color: "var(--pink)" }}>Explore</span> {t("explore").replace(/^Explore /, "")}</h2>
      <div className="chips" style={{ marginBottom: 18 }}>
        <label className="search">🔍<input aria-label="Search" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        {FILTERS.map(([g, v, label]) => (
          <button key={g + v} className={`chip ${f[g] === v ? "on" : ""}`} onClick={() => setF({ ...f, [g]: f[g] === v ? "" : v })}>{label}</button>
        ))}
      </div>

      {shown.length === 0 && chars && <p className="muted">No characters found. Try another search or filter.</p>}
      <div className="grid">
        {shown.map((c, i) => (
          <div key={c.id} className="card" onClick={() => open(c.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && open(c.id)}>
            <div className="img"><Portrait c={c} height="100%" round={0} /></div>
            {c.clipV && <ClipVideo className="clip" src={`/api/portraits/${c.id}/clip?v=${c.clipV}`} />}
            <div className="shade" />
            {Date.now() - (c.createdAt ?? 0) < WEEK ? <span className="new">✦ NEW</span> : i < 3 && <span className="badge">🔥 HOT</span>}
            <span className="online" title="Online" />
            <div className="info">
              <div className="name">{c.name.split(" ")[0]}<small>{c.age}</small></div>
              <div className="tag">{c.tagline || `${pretty(c.occupation)} · ${pretty(c.personality)}`}</div>
            </div>
            <div className="cta"><span className="btn" style={{ width: "100%" }}>💬 {t("chatWith")} {c.name.split(" ")[0]}</span></div>
          </div>
        ))}
      </div>

      <h2 style={{ margin: "36px 0 0" }}>Explore more</h2>
      <div className="explore" style={{ marginTop: 12 }}>
        <Link href="/create">🪄 Create my AI</Link>
        <Link href="/swipe">💘 Swipe & match</Link>
        <Link href="/discover">✨ Discover</Link>
        <Link href="/chats">💬 My chats</Link>
        <Link href="/premium">💎 Premium -70%</Link>
      </div>

      <section className="faq">
        <h2 style={{ margin: "0 0 6px" }}>FAQ</h2>
        {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
      </section>

      <footer className="muted" style={{ margin: "32px 0 16px", fontSize: 12, lineHeight: 1.7 }}>
        © {new Date().getFullYear()} {BRAND}. All characters and media are AI-generated and fictional. 18+ only.{" "}
        <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/grievance">Grievances</Link>
      </footer>

      {daily && (
        <div className="backdrop" onClick={() => setDaily(null)}>
          <div className="modal" style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 54 }}>🔥</div>
            <h2 style={{ margin: "6px 0" }}>Daily reward</h2>
            <p className="muted" style={{ margin: "0 0 14px" }}>{daily.streak > 0 ? `${daily.streak}-day streak! Keep it going 😏` : "Come back every day for bigger rewards."}</p>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => <span key={d} className={`chip ${d <= daily.streak + 1 ? "on" : ""}`} style={{ padding: "6px 9px" }}>D{d}</span>)}
            </div>
            <button className="btn" style={{ width: "100%" }} onClick={() => void claim()}>Claim {daily.reward} 💎</button>
          </div>
        </div>
      )}
      {auth && <AuthModal mode={auth} onClose={() => setAuth(null)} onDone={() => { setAuth(null); void refresh(); }} />}
    </main>
  );
}
