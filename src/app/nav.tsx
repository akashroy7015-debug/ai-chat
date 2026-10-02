"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "./ui";
import { LangSwitch, useT, type Key } from "./i18n";

const LINKS = [
  ["/", "🏠", "home"],
  ["/discover", "✨", "discover"],
  ["/chats", "💬", "chats"],
  ["/collection", "🖼️", "collection"],
  ["/create", "➕", "create"],
  ["/my-ai", "💖", "myAi"],
  ["/premium", "👑", "premium"],
] as const satisfies readonly (readonly [string, string, Key])[];

export function Nav() {
  const path = usePathname();
  const { t } = useT();
  return (
    <nav className="side">
      <Link href="/" className="brand">{BRAND}</Link>
      {LINKS.map(([href, icon, label]) => (
        <Link key={href} href={href} className={path === href ? "on" : ""}>
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
        .side a{color:var(--text);padding:11px 14px;border-radius:12px;display:flex;gap:12px;align-items:center;font-size:15px;font-weight:500;transition:background .15s}
        .side a.on{background:linear-gradient(135deg,rgba(255,61,129,.18),rgba(124,92,255,.18));box-shadow:inset 0 0 0 1px rgba(255,61,129,.35)}
        .side a:hover{background:var(--panel2)}
        .side .brand{font-weight:900;font-size:24px;margin:0 0 14px;letter-spacing:-.02em;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}
        .side .badge{margin-left:auto;background:var(--grad);color:#fff;font-size:11px;padding:2px 7px;border-radius:999px;font-weight:800}
        .side .lang{margin-top:auto;padding:8px 12px}
        .side .foot{font-size:12px;color:var(--muted);padding:0 12px}
        .side .foot a{display:inline;padding:0;color:var(--muted);font-size:12px}
        .shell{margin-left:246px;padding:0 20px 20px;max-width:1360px}
        @media (max-width:760px){
          .side{inset:auto 0 0 0;width:auto;height:62px;flex-direction:row;padding:6px;border-right:0;border-top:1px solid var(--line);justify-content:space-around;background:rgba(20,20,28,.97)}
          .side .brand,.side .foot,.side .lbl,.side .badge{display:none}
          .side .lang{display:none}
          .side a{padding:8px;font-size:22px}
          .shell{margin-left:0;padding:0 12px 84px}
        }
      `}</style>
    </nav>
  );
}
