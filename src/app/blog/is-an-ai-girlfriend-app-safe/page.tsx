import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Is an AI girlfriend app safe and private?", description: "A practical checklist for privacy and safety when using AI girlfriend and companion apps, and how FlirtIQ handles your data.", alternates: { canonical: "/blog/is-an-ai-girlfriend-app-safe" } };

const LD = "{\"@context\": \"https://schema.org\", \"@type\": \"Article\", \"headline\": \"Is an AI girlfriend app safe and private?\", \"description\": \"A practical checklist for privacy and safety when using AI girlfriend and companion apps, and how FlirtIQ handles your data.\", \"author\": {\"@type\": \"Organization\", \"name\": \"FlirtIQ\"}, \"publisher\": {\"@type\": \"Organization\", \"name\": \"FlirtIQ\"}, \"datePublished\": \"2026-11-08\"}";

export default function Post() {
  return (
    <main style={{ maxWidth: 760, lineHeight: 1.75 }}>
      <nav className="muted" style={{ fontSize: 13, margin: "8px 0 14px" }}><Link href="/">Home</Link> › <Link href="/blog">Blog</Link></nav>
      <h1>Is an AI girlfriend app safe and private?</h1>
      <p className="muted">A practical checklist for privacy and safety when using AI girlfriend and companion apps, and how FlirtIQ handles your data.</p>
      <h2>What to check before you sign up</h2>
      <p>Read the privacy policy: does the app sell data, use chats for advertising, or make deletion hard? Look for clear contact details and a grievance process.</p>
      <h2>Payment safety</h2>
      <p>Prefer apps where payments go through a payment provider so the app never stores your card. Check whether plans renew automatically.</p>
      <h2>Age and content rules</h2>
      <p>A responsible app is strictly 18+, blocks content involving minors or real people, and has a report button. FlirtIQ does all of these.</p>
      <h2>How FlirtIQ handles your data</h2>
      <p>Chats are private to your account, we do not sell personal data or use advertising trackers, and you can request deletion by email.</p>
      <h2>Keep a healthy balance</h2>
      <p>AI companions are fictional characters for fun and comfort. Enjoy them, but keep real-world connections too, and reach out to a helpline if you are struggling.</p>
      <div style={{ margin: "28px 0" }}><Link href="/girls" className="btn btn-gold">Meet the FlirtIQ companions →</Link></div>
      <p className="muted" style={{ fontSize: 12 }}>FlirtIQ is for adults 18+. All characters are fictional and AI-generated.</p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: LD }} />
    </main>
  );
}
