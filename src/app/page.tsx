"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BRAND, ClipVideo, Logo, pretty, Portrait, type CharacterCard } from "./ui";
import { AgeGateModal, AuthModal } from "./auth-panel";
import { LangSwitch, useT } from "./i18n";

const CATEGORIES = ["girls", "milf", "anime", "guys"] as const;
const FILTERS: [group: "ethnicity" | "hair" | "ageRange", value: string, label: string][] = [
  ["ethnicity", "caucasian", "Caucasian"], ["ethnicity", "latina", "Latina"], ["ethnicity", "asian", "Asian"],
  ["ethnicity", "arab", "Arab"], ["ethnicity", "african", "African"], ["ethnicity", "south_asian", "Indian"],
  ["hair", "blonde", "Blonde"], ["hair", "brown", "Brunette"], ["hair", "black", "Black hair"], ["hair", "red", "Redhead"],
  ["ageRange", "20s", "20s"], ["ageRange", "30s", "30s"], ["ageRange", "40plus", "40+"],
];

type Theme = { key: string; script: string; big: string; mid: string; sub: string; cta: string; href: string; bubble: string; pick: (c: CharacterCard) => boolean };
/** Teaser posters that follow the sale slide in the banner. */
const THEMES: Theme[] = [
  { key: "night", script: "late night talks", big: "LATE NIGHT", mid: "SPECIAL", sub: "She stays up for you. Talk till sunrise.", cta: "Keep her company", href: "#models", bubble: "can't sleep… talk to me?", pick: () => true },
  { key: "desi", script: "thodi si filmy", big: "DESI", mid: "GIRLS", sub: "Chat in Hindi, Hinglish or English. She replies your way.", cta: "Baat karo", href: "#models", bubble: "kahan the itne din?", pick: (c) => c.ethnicity === "south_asian" || c.ethnicity === "arab" },
  { key: "milf", script: "elegant & confident", big: "MATURE", mid: "& CLASSY", sub: "Confident, experienced women who know how to hold a conversation.", cta: "Meet them", href: "#models", bubble: "dinner date tonight?", pick: (c) => c.age >= 35 },
  { key: "swipe", script: "one of them already likes you", big: "SWIPE.", mid: "MATCH. FLIRT.", sub: "Swipe right on your type and get an instant match.", cta: "Start swiping", href: "/swipe", bubble: "it's a match!", pick: () => true },
];
const SLIDE_COUNT = THEMES.length + 1;
const WEEK = 7 * 86_400_000;

const FAQ = [
  ["What is this?", "A place to chat with AI companions who remember you, flirt back, send voice messages and keep the conversation going. Every character is a fictional adult created by AI."],
  ["Is it private?", "Your chats are private to your account. We never sell your data, and you can ask us to delete everything at any time."],
  ["Why do I need to verify my age?", "Our companions are for adults only. A quick ID check keeps the platform 18+ and safe for everyone."],
  ["Can I create my own character?", "Yes. Pick her looks, body type, outfit, personality and voice, and she's ready to chat in seconds."],
  ["Does it speak Hindi?", "Yes. Write in English, Hindi or Hinglish and your companion replies in the same language."],
];

const TEASE = ["hey… you finally came", "i was just thinking about you", "tell me about your day?"];

/** Her messages appear one by one with typing dots in between. */
function TeaseChat() {
  const [n, setN] = useState(1);
  useEffect(() => { const t = setInterval(() => setN((k) => (k > TEASE.length ? 1 : k + 1)), 1800); return () => clearInterval(t); }, []);
  return (
    <div className="tease-chat" aria-live="polite">
      {TEASE.slice(0, Math.min(n, TEASE.length)).map((m) => <div key={m} className="tb">{m}</div>)}
      {n <= TEASE.length && <div className="tb typing"><i /><i /><i /></div>}
    </div>
  );
}

/** Real countdown to midnight India time (the daily deal resets each day). */
function Countdown() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const ist = Date.now() + 5.5 * 3_600_000;
      setLeft(86_400_000 - (ist % 86_400_000));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  if (left === null) return null;
  const s = Math.floor(left / 1000);
  const parts = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0"));
  return (
    <div className="countdown" aria-label="Deal ends in">
      <span className="lbl">Ends in</span>
      {parts.map((p, i) => <span key={i} style={{ display: "contents" }}>{i > 0 && <b>:</b>}<span className="box">{p}</span></span>)}
    </div>
  );
}

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
  useEffect(() => { const t = setInterval(() => setSlide((s) => (s + 1) % SLIDE_COUNT), 6000); return () => clearInterval(t); }, []);

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

  const [ageGate, setAgeGate] = useState<string | null>(null);

  const verified = me?.ageStatus === "verified";
  const shown = (chars ?? []).filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));
  function open(id: string) {
    if (!me) return setAuth("register");
    if (!verified) return setAgeGate(id);
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
        <div className={`slide promo ${slide === 0 ? "on" : ""}`}>
          <div className="promo-copy">
            <div className="script">Hot deal, just for you</div>
            <div className="big">SIZZLY</div>
            <div className="mid">SALE</div>
            <div className="row">
              <div className="sticker"><b>70%</b><span>OFF</span></div>
              <div className="perks">
                <div>Unlimited flirty chats, voice notes &amp; surprise photos</div>
                <Countdown />
              </div>
            </div>
            <Link href="/premium" className="btn btn-gold promo-cta">Grab the deal →</Link>
          </div>
          <div className="promo-art">
            {(chars ?? []).slice(0, 3).map((c, k) => (
              <Link key={c.id} href={`/chat?c=${c.id}`} className={`pcard p${k}`}>
                <Portrait c={c} height="100%" round={0} w={400} />
                {k === 1 && <span className="online-tag">She&apos;s online</span>}
              </Link>
            ))}
            <span className="bubble-a">miss me yet?</span>
            <span className="bubble-b">come say hi</span>
          </div>
        </div>
        {THEMES.map((th, j) => {
          const k = j + 1;
          const girls = (chars ?? []).filter((c) => c.gender !== "male" && c.style !== "anime");
          const mine = [...girls.filter(th.pick), ...girls].filter((c, i, all) => all.indexOf(c) === i).slice(j, j + 2);
          return (
            <div key={th.key} className={`slide theme t-${th.key} ${slide === k ? "on" : ""}`}>
              <div className="t-copy">
                <div className="script">{th.script}</div>
                <div className="big">{th.big}</div>
                <div className="mid">{th.mid}</div>
                <p>{th.sub}</p>
                <Link href={th.href} className="btn btn-gold">{th.cta}</Link>
              </div>
              <div className="t-art">
                {mine.map((c, n) => <Link key={c.id} href={`/chat?c=${c.id}`} className={`pcard p${n}`}><Portrait c={c} height="100%" round={0} w={400} /></Link>)}
                <span className="bubble-a">{th.bubble}</span>
              </div>
            </div>
          );
        })}
        <button className="arrow l" aria-label="Previous" onClick={() => setSlide((slide + SLIDE_COUNT - 1) % SLIDE_COUNT)}>‹</button>
        <button className="arrow r" aria-label="Next" onClick={() => setSlide((slide + 1) % SLIDE_COUNT)}>›</button>
        <div className="dots">{Array.from({ length: SLIDE_COUNT }, (_, k) => <button key={k} aria-label={`Slide ${k + 1}`} className={slide === k ? "on" : ""} onClick={() => setSlide(k)} />)}</div>
      </section>

      {chars && chars.length > 0 && (() => {
        const star = chars.find((c) => c.clipV) ?? chars[0];
        return (<>
          <section className="stories" aria-label="Online now">
            {chars.slice(0, 12).map((c) => (
              <button key={c.id} className="story" onClick={() => open(c.id)}>
                <span className="ring"><Portrait c={c} height="100%" round={999} /></span>
                <span>{c.name.split(" ")[0]}</span>
              </button>
            ))}
          </section>
          <section className="hero" aria-label="Featured">
            <div className="hero-media" onClick={() => open(star.id)}>
              <Portrait c={star} height="100%" round={0} w={900} />
              {star.clipV && <ClipVideo className="clip" src={`/api/portraits/${star.id}/clip?v=${star.clipV}`} />}
              <div className="shade" />
              <span className="live"><i />Online now</span>
              <div className="hero-name"><div className="script">she&apos;s been waiting…</div>{star.name.split(" ")[0]} <small>{star.age}</small></div>
            </div>
            <div className="hero-side">
              <div className="script">psst… over here</div>
              <h2>She&apos;s been waiting for you</h2>
              <TeaseChat />
              <button className="btn hero-cta" onClick={() => open(star.id)}>💬 Message {star.name.split(" ")[0]}</button>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>Free to start · replies in English, Hindi &amp; Hinglish</p>
            </div>
          </section>
        </>);
      })()}

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
            <div className="img"><Portrait c={c} height="100%" round={0} w={400} /></div>
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

      {!me?.premium && chars && chars.length > 3 && (
        <section className="locked" aria-label="Premium photos">
          <div className="locked-pics">
            {chars.slice(3, 7).map((c) => <div key={c.id}><Portrait c={c} height="100%" round={0} w={192} /><span>🔒</span></div>)}
          </div>
          <div>
            <div className="script">just for you…</div>
            <h2 style={{ margin: "2px 0 8px" }}>She saves her best photos for Premium</h2>
            <p className="muted" style={{ margin: "0 0 14px" }}>Unlimited chats, voice notes and surprise photos. 70% off today.</p>
            <Link href="/premium" className="btn btn-gold">Unlock Premium →</Link>
          </div>
        </section>
      )}

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
        <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/refund">Refunds</Link> · <Link href="/contact">Contact</Link> · <Link href="/grievance">Grievances</Link>
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
      {ageGate && <AgeGateModal onClose={() => setAgeGate(null)} onDone={() => { const id = ageGate; setAgeGate(null); void refresh(); router.push(`/chat?c=${id}`); }} />}
      {auth && <AuthModal mode={auth} onClose={() => setAuth(null)} onDone={() => { setAuth(null); void refresh(); }} />}
    </main>
  );
}
