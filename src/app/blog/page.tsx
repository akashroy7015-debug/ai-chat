import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "FlirtIQ blog: AI companions, tips and guides", description: "Guides and honest comparisons about AI girlfriends and AI companion apps.", alternates: { canonical: "/blog" } };

export default function Blog() {
  return (
    <main style={{ maxWidth: 760, lineHeight: 1.7 }}>
      <h1>FlirtIQ blog</h1>
      <ul style={{ display: "grid", gap: 18, paddingLeft: 18 }}>
        <li><Link href="/blog/ai-companion-app-with-voice"><b>AI companion app with voice notes: hear her talk back</b></Link><br /><span className="muted">How voice notes make an AI companion feel more real, how they work on FlirtIQ, and tips for getting the most out of them.</span></li>
        <li><Link href="/blog/virtual-girlfriend-app"><b>Virtual girlfriend app: how it works and what to expect</b></Link><br /><span className="muted">A clear guide to virtual girlfriend apps: how the AI works, what a good one feels like, and how to start with FlirtIQ.</span></li>
        <li><Link href="/blog/ai-girlfriend-free"><b>AI girlfriend free: what you really get without paying</b></Link><br /><span className="muted">What free AI girlfriend apps actually include, where the limits are, and how to try FlirtIQ free before deciding whether to upgrade.</span></li>
        <li><Link href="/blog/ai-girlfriend-that-remembers-you"><b>AI girlfriend that remembers you: why memory matters</b></Link><br /><span className="muted">Why memory is the feature that makes an AI companion feel real, how it works, and what FlirtIQ remembers about your chats.</span></li>
        <li><Link href="/blog/talk-to-ai-girlfriend-in-hindi"><b>Talk to an AI girlfriend in Hindi or Hinglish</b></Link><br /><span className="muted">How to chat with an AI companion in Hindi, Hinglish or English, and why language matters for a natural conversation.</span></li>
        <li><Link href="/blog/is-an-ai-girlfriend-app-safe"><b>Is an AI girlfriend app safe and private?</b></Link><br /><span className="muted">A practical checklist for privacy and safety when using AI girlfriend and companion apps, and how FlirtIQ handles your data.</span></li>
        <li><Link href="/blog/best-ai-girlfriend-apps"><b>Best AI girlfriend apps in 2026 (honest comparison)</b></Link><br /><span className="muted">A plain-English comparison of AI girlfriend and companion apps: what to look for in memory, personality, languages, privacy and price.</span></li>
        <li><Link href="/blog/how-to-talk-to-an-ai-girlfriend"><b>How to talk to an AI girlfriend: 10 tips for better chats</b></Link><br /><span className="muted">Get more fun, personal conversations from your AI companion with these simple tips on memory, role-play, mood and relationship levels.</span></li>
        <li><Link href="/blog/ai-companion-for-loneliness"><b>Can an AI companion help with loneliness?</b></Link><br /><span className="muted">What AI companions can and cannot do for loneliness, how to use them in a healthy way, and when to reach out to real people or professionals.</span></li>
        <li><Link href="/blog/character-ai-alternative"><b>Character AI alternative for romantic chats</b></Link><br /><span className="muted">Looking for a Character AI alternative with memory, romance and Hindi/Hinglish support? Here is how FlirtIQ compares.</span></li>
      </ul>
    </main>
  );
}
