"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./ui";
import { LangSwitch, useT, type Key } from "./i18n";

const LINKS = [
  ["/", "🏠", "home"],
  ["/discover", "✨", "discover"],
  ["/chats", "💬", "chats"],
  ["/swipe", "💘", "swipe"],
  ["/create", "➕", "create"],
  ["/my-ai", "💖", "myAi"],
  ["/premium", "👑", "premium"],
] as const satisfies readonly (readonly [string, string, Key])[];

export function Nav() {
  const path = usePathname();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  return (
    <>
    <nav className="side">
      <Link href="/" className="brand" aria-label="FlirtIQ home"><Logo size={28} /></Link>
      {LINKS.map(([href, icon, label]) => (
        <Link key={href} href={href} className={`${path === href ? "on" : ""} ${href === "/premium" ? "premium" : ""} ${href === "/swipe" ? "hero-btn" : ""} ${["/discover", "/my-ai", "/premium"].includes(href) ? "drawer-only" : ""}`}>
          <span>{icon}</span> <span className="lbl">{t(label)}</span>
          {href === "/premium" && <b className="badge">-70%</b>}
        </Link>
      ))}
      <button className="menu-btn" aria-label="Open menu" onClick={() => setOpen(true)}>☰</button>
      <div className="lang"><LangSwitch /></div>
      <div className="foot">
        <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/refund">Refunds</Link> · <Link href="/contact">Contact</Link>
      </div>
      <style>{`
        .side{position:fixed;inset:0 auto 0 0;width:230px;padding:18px 12px;background:var(--panel);border-right:1px solid var(--line);display:flex;flex-direction:column;gap:4px;z-index:10}
        .side a{color:var(--text);padding:10px 12px;border-radius:12px;border:1px solid var(--line);display:flex;gap:12px;align-items:center;font-size:14px;font-weight:600;transition:background .15s}
        .side a.premium{color:var(--gold)}
        .side a.on{background:rgba(232,93,128,.14);box-shadow:inset 0 0 0 1px rgba(232,93,128,.45)}
        .side a:hover{background:var(--panel2)}
        .side .brand{border:0 !important;margin:0 0 14px;padding:6px 8px !important;background:none !important;box-shadow:none !important}
        .side .badge{margin-left:auto;background:#d9364f;color:#fff;font-size:11px;padding:2px 7px;border-radius:999px;font-weight:800}
        .side .lang{margin-top:auto;padding:8px 12px}
        .side .foot{font-size:12px;color:var(--muted);padding:0 12px}
        .side .foot a{display:inline;padding:0;color:var(--muted);font-size:12px}
        .shell{margin-left:246px;padding:0 20px 20px;max-width:1360px}
        @media (max-width:760px){
          .side a{border:0}
          .side{inset:auto 0 0 0;width:auto;height:62px;flex-direction:row;padding:6px;border-right:0;border-top:1px solid var(--line);justify-content:space-around;background:rgba(20,20,28,.97)}
          .side .brand,.side .foot,.side .lbl,.side .badge{display:none}
          .side .lang{display:none}
          .side a{padding:8px;font-size:22px}
          .side a.hero-btn{position:relative;top:-18px;width:62px;height:62px;padding:0;justify-content:center;border-radius:50%;font-size:28px;
            background:linear-gradient(135deg,#ff2d78,#ff5a3c 60%,#ffb347);box-shadow:0 0 0 5px var(--bg),0 8px 24px rgba(255,45,120,.55);animation:sizzle 2.2s ease-in-out infinite}
          .side a.hero-btn.on,.side a.hero-btn:hover{background:linear-gradient(135deg,#ff2d78,#ff5a3c 60%,#ffb347)}
          @keyframes sizzle{0%,100%{box-shadow:0 0 0 5px var(--bg),0 8px 24px rgba(255,45,120,.5)}50%{box-shadow:0 0 0 5px var(--bg),0 8px 34px rgba(255,90,60,.85),0 0 0 9px rgba(255,45,120,.18)}}
          .shell{margin-left:0;padding:0 12px 84px}
        }
      `}</style>
    </nav>
    <div className={`drawer-scrim ${open ? "on" : ""}`} onClick={() => setOpen(false)} />
    <aside className={`drawer ${open ? "on" : ""}`} aria-label="Menu" aria-hidden={!open}>
      <div className="d-head"><Logo size={24} /><button aria-label="Close menu" onClick={() => setOpen(false)}>✕</button></div>
      {LINKS.map(([href, icon, label]) => (
        <Link key={href} href={href} className={path === href ? "on" : ""} tabIndex={open ? 0 : -1}><span className="ic">{icon}</span>{t(label)}</Link>
      ))}
      <div className="d-promo">
        <div className="script">she misses you</div>
        <b>Premium, 70% off today</b>
        <Link href="/premium" className="btn btn-gold" tabIndex={open ? 0 : -1}>Go Premium</Link>
      </div>
      <div className="d-foot"><LangSwitch /> <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/refund">Refunds</Link> · <Link href="/contact">Contact</Link></div>
    </aside>
    <style>{`
      .side .menu-btn{display:none}
      .drawer,.drawer-scrim{display:none}
      @media (max-width:760px){
        .side a.drawer-only{display:none}
        .side .menu-btn{display:block;background:none;border:0;color:var(--text);font-size:24px;padding:8px;cursor:pointer}
        .drawer-scrim{display:block;position:fixed;inset:0;z-index:30;background:rgba(0,0,0,.6);opacity:0;pointer-events:none;transition:opacity .3s}
        .drawer-scrim.on{opacity:1;pointer-events:auto}
        .drawer{display:flex;position:fixed;inset:0 auto 0 0;z-index:31;width:290px;box-sizing:border-box;padding:18px 14px;flex-direction:column;gap:4px;background:var(--panel);border-right:1px solid var(--line);box-shadow:20px 0 50px rgba(0,0,0,.5);transform:translateX(-105%);transition:transform .35s cubic-bezier(.2,.8,.2,1);overflow-y:auto}
        .drawer.on{transform:none}
        .drawer .d-head{display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;margin-bottom:6px;border-bottom:1px solid var(--line)}
        .drawer .d-head button{width:40px;height:40px;border-radius:50%;border:0;background:var(--panel2);color:var(--text);font-size:16px;cursor:pointer}
        .drawer > a{display:flex;align-items:center;gap:12px;min-height:48px;padding:4px 10px;border-radius:14px;color:var(--text);font-weight:800;font-size:16px}
        .drawer > a .ic{width:36px;height:36px;border-radius:10px;background:var(--panel2);display:flex;align-items:center;justify-content:center;font-size:18px}
        .drawer > a.on{background:rgba(232,93,128,.16)} .drawer > a.on .ic{background:var(--pink)}
        .drawer .d-promo{margin-top:auto;padding:16px;border-radius:18px;background:linear-gradient(135deg,#3a1328,#241018);border:1px solid #5a2a44;display:flex;flex-direction:column;gap:8px}
        .drawer .d-promo .script{font-size:16px}
        .drawer .d-foot{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:12px;color:var(--muted);padding:12px 4px 0}
        .drawer .d-foot a{color:var(--muted)}
      }
    `}</style>
    </>
  );
}
