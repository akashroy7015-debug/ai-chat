"use client";
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
  return (
    <nav className="side">
      <Link href="/" className="brand" aria-label="Sizzly home"><Logo size={28} /></Link>
      {LINKS.map(([href, icon, label]) => (
        <Link key={href} href={href} className={`${path === href ? "on" : ""} ${href === "/premium" ? "premium" : ""} ${href === "/swipe" ? "hero-btn" : ""}`}>
          <span>{icon}</span> <span className="lbl">{t(label)}</span>
          {href === "/premium" && <b className="badge">-70%</b>}
        </Link>
      ))}
      <div className="lang"><LangSwitch /></div>
      <div className="foot">
        <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/grievance">Help</Link>
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
  );
}
