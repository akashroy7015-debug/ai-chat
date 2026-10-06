import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "FlirtIQ blog: AI companions, tips and guides", description: "Guides and honest comparisons about AI girlfriends and AI companion apps.", alternates: { canonical: "/blog" } };

export default function Blog() {
  return (
    <main style={{ maxWidth: 760, lineHeight: 1.7 }}>
      <h1>FlirtIQ blog</h1>
      <ul style={{ display: "grid", gap: 18, paddingLeft: 18 }}>
        <li><Link href="/blog/best-ai-girlfriend-apps"><b>Best AI girlfriend apps in 2026 (honest comparison)</b></Link><br /><span className="muted">A plain-English comparison of AI girlfriend and companion apps: what to look for in memory, personality, languages, privacy and price.</span></li>
        <li><Link href="/blog/how-to-talk-to-an-ai-girlfriend"><b>How to talk to an AI girlfriend: 10 tips for better chats</b></Link><br /><span className="muted">Get more fun, personal conversations from your AI companion with these simple tips on memory, role-play, mood and relationship levels.</span></li>
        <li><Link href="/blog/ai-companion-for-loneliness"><b>Can an AI companion help with loneliness?</b></Link><br /><span className="muted">What AI companions can and cannot do for loneliness, how to use them in a healthy way, and when to reach out to real people or professionals.</span></li>
        <li><Link href="/blog/character-ai-alternative"><b>Character AI alternative for romantic chats</b></Link><br /><span className="muted">Looking for a Character AI alternative with memory, romance and Hindi/Hinglish support? Here is how FlirtIQ compares.</span></li>
      </ul>
    </main>
  );
}
