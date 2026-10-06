import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "AI girlfriend app in India that speaks Hindi & Hinglish", description: "Chat with an AI girlfriend who replies in Hindi, Hinglish or English, remembers you and sends voice notes. Made for India. 10 free messages, no card needed.", alternates: { canonical: "/ai-girlfriend-india" } };

export default function Landing() {
  return (
    <main style={{ maxWidth: 820, lineHeight: 1.7 }}>
      <h1>An AI girlfriend who actually speaks your language</h1>
      <p>Most AI companion apps only speak English. FlirtIQ characters reply in <b>Hindi, Hinglish or English</b> — whatever you text in — so a late-night "kya kar rahi ho?" gets a real, flirty answer.</p>
      <h2>What makes FlirtIQ different</h2>
      <ul>
        <li><b>Desi characters</b> like Ananya and Priya, plus latina, asian, arab and mature companions.</li>
        <li><b>Memory:</b> she remembers your name, your day and what you told her last week.</li>
        <li><b>Relationship levels:</b> go from stranger to crush to girlfriend as you chat.</li>
        <li><b>Voice notes and photos</b> from your favourite character.</li>
        <li><b>Prices in rupees</b> and 10 free messages to try, no card needed.</li>
      </ul>
      <h2>Is it private?</h2>
      <p>Your chats are private to your account and we never sell your data. Read our <Link href="/privacy">privacy policy</Link>.</p>
      <p><Link href="/girls" className="btn btn-gold">Meet the girls →</Link></p>
      <p className="muted" style={{ fontSize: 12 }}>FlirtIQ is for adults 18+. All characters are fictional and AI-generated.</p>
    </main>
  );
}
