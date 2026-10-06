import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI girlfriend app: chat with AI companions who remember you",
  description: "FlirtIQ is an AI girlfriend and companion app. Pick a character, chat in English (or Hindi), get voice notes and photos, and build a relationship that remembers you. 10 free messages.",
  alternates: { canonical: "/ai-girlfriend-app" },
};

export default function Landing() {
  return (
    <main style={{ maxWidth: 820, lineHeight: 1.7 }}>
      <h1>The AI girlfriend app that actually remembers you</h1>
      <p>FlirtIQ lets you chat with AI companions who have their own looks, personality, job and moods. They remember your name, your day and your inside jokes, and the relationship grows the more you talk.</p>
      <h2>Why people choose FlirtIQ</h2>
      <ul>
        <li><b>Dozens of companions:</b> girl-next-door, mature, latina, asian, desi, anime and more, or create your own.</li>
        <li><b>Real memory:</b> she brings up things you told her days ago.</li>
        <li><b>Relationship levels:</b> from stranger to crush to partner as you chat.</li>
        <li><b>Voice notes and photos</b> from your favourite character.</li>
        <li><b>Any language:</b> English, Hindi and Hinglish, with more coming.</li>
        <li><b>Fair pricing:</b> 10 free messages, then simple plans in your currency with monthly credits.</li>
      </ul>
      <h2>Private and safe</h2>
      <p>Your chats are private to your account and never sold. FlirtIQ is for adults 18+ only, and every character is fictional and AI-generated. Read our <Link href="/privacy">privacy policy</Link>.</p>
      <p><Link href="/girls" className="btn btn-gold">Meet the companions →</Link></p>
    </main>
  );
}
