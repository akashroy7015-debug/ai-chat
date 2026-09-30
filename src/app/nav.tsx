"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { theme } from "./ui";

const LINKS = [
  ["/", "🏠", "Home"],
  ["/discover", "✨", "Discover"],
  ["/chats", "💬", "Chats"],
  ["/collection", "🖼️", "Collection"],
  ["/create", "➕", "Create Character"],
  ["/my-ai", "💖", "My AI"],
  ["/premium", "👑", "Premium"],
] as const;

export function Nav() {
  const path = usePathname();
  return (
    <nav className="side">
      <Link href="/" className="brand">AI Chat</Link>
      {LINKS.map(([href, icon, label]) => (
        <Link key={href} href={href} className={path === href ? "on" : ""}>
          <span>{icon}</span> <span className="lbl">{label}</span>
          {href === "/premium" && <b className="badge">-70%</b>}
        </Link>
      ))}
      <div className="foot">
        <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/grievance">Help</Link>
      </div>
      <style>{`
        .side{position:fixed;inset:0 auto 0 0;width:220px;padding:16px 12px;background:${theme.card};border-right:1px solid ${theme.line};display:flex;flex-direction:column;gap:4px;z-index:10}
        .side a{color:${theme.text};text-decoration:none;padding:10px 12px;border-radius:10px;display:flex;gap:10px;align-items:center;font-size:15px}
        .side a.on,.side a:hover{background:#26262f}
        .side .brand{font-weight:800;font-size:20px;margin-bottom:8px;color:${theme.accent}}
        .side .badge{margin-left:auto;background:${theme.accent};color:#fff;font-size:11px;padding:2px 6px;border-radius:6px}
        .side .foot{margin-top:auto;font-size:12px;color:${theme.muted}}
        .side .foot a{display:inline;padding:0;color:${theme.muted};font-size:12px}
        .shell{margin-left:236px;padding:16px;max-width:1200px}
        @media (max-width:760px){
          .side{inset:auto 0 0 0;width:auto;height:60px;flex-direction:row;padding:6px;border-right:0;border-top:1px solid ${theme.line};justify-content:space-around}
          .side .brand,.side .foot,.side .lbl,.side .badge{display:none}
          .side a{padding:8px;font-size:22px}
          .shell{margin-left:0;padding:12px 12px 80px}
        }
      `}</style>
    </nav>
  );
}
