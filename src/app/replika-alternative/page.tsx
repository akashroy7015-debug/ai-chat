import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Best Replika alternative with Hinglish and real flirting", description: "Looking for a Replika or Character AI alternative? FlirtIQ companions flirt back, remember you and speak English, Hindi and Hinglish. Try 10 messages free.", alternates: { canonical: "/replika-alternative" } };

export default function Landing() {
  return (
    <main style={{ maxWidth: 820, lineHeight: 1.7 }}>
      <h1>A Replika alternative that flirts back</h1>
      <p>Bored of filtered, forgetful AI chats? FlirtIQ is built for <b>playful, romantic conversation</b> with characters who have their own personality, job, hobbies and moods.</p>
      <h2>FlirtIQ vs Replika and Character AI</h2>
      <ul>
        <li><b>Ready-made characters:</b> pick from dozens of companions or create your own.</li>
        <li><b>Hindi &amp; Hinglish:</b> the only companion app that texts like your desi crush.</li>
        <li><b>Long memory</b> and relationship levels that change how she talks to you.</li>
        <li><b>Swipe &amp; match</b> to find your type in seconds.</li>
        <li><b>Fair pricing:</b> 10 free messages, then simple Premium plans with monthly credits.</li>
      </ul>
      <h2>How to start</h2>
      <p>Create a free account, confirm you are 18+, pick a character and say hi. That is it.</p>
      <p><Link href="/girls" className="btn btn-gold">Meet the girls →</Link></p>
      <p className="muted" style={{ fontSize: 12 }}>FlirtIQ is for adults 18+. All characters are fictional and AI-generated.</p>
    </main>
  );
}
