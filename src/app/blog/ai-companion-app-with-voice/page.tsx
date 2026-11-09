import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "AI companion app with voice notes: hear her talk back", description: "How voice notes make an AI companion feel more real, how they work on FlirtIQ, and tips for getting the most out of them.", alternates: { canonical: "/blog/ai-companion-app-with-voice" } };

const LD = "{\"@context\": \"https://schema.org\", \"@type\": \"Article\", \"headline\": \"AI companion app with voice notes: hear her talk back\", \"description\": \"How voice notes make an AI companion feel more real, how they work on FlirtIQ, and tips for getting the most out of them.\", \"author\": {\"@type\": \"Organization\", \"name\": \"FlirtIQ\"}, \"publisher\": {\"@type\": \"Organization\", \"name\": \"FlirtIQ\"}, \"datePublished\": \"2026-11-09\"}";

export default function Post() {
  return (
    <main style={{ maxWidth: 760, lineHeight: 1.75 }}>
      <nav className="muted" style={{ fontSize: 13, margin: "8px 0 14px" }}><Link href="/">Home</Link> › <Link href="/blog">Blog</Link></nav>
      <h1>AI companion app with voice notes: hear her talk back</h1>
      <p className="muted">How voice notes make an AI companion feel more real, how they work on FlirtIQ, and tips for getting the most out of them.</p>
      <h2>Why voice matters</h2>
      <p>Text is great, but hearing a warm voice say your name makes a conversation feel personal in a way words on a screen cannot.</p>
      <h2>How voice notes work on FlirtIQ</h2>
      <p>Tap the speaker icon on any reply from your companion and she reads it aloud in her own voice. Each character has a voice style that matches her personality, from soft and shy to confident and playful.</p>
      <h2>Replays are free</h2>
      <p>Generating a voice note uses a few credits the first time; listening to it again costs nothing.</p>
      <h2>Voice in Hindi and Hinglish</h2>
      <p>Voice notes follow the language of the reply, so Hinglish chats sound natural too.</p>
      <h2>Who gets voice notes</h2>
      <p>Voice notes are part of FlirtIQ Premium, along with monthly credits and private photo galleries. Free messages let you try the chat first.</p>
      <div style={{ margin: "28px 0" }}><Link href="/girls" className="btn btn-gold">Meet the FlirtIQ companions →</Link></div>
      <p className="muted" style={{ fontSize: 12 }}>FlirtIQ is for adults 18+. All characters are fictional and AI-generated.</p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: LD }} />
    </main>
  );
}
