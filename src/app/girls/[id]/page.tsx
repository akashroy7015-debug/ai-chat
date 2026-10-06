import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listFeatured } from "@/lib/characters/featured";
import { pretty } from "../../ui";

export const dynamic = "force-dynamic";

const find = (id: string) => listFeatured().find((c) => c.id === id);
const first = (n: string) => n.split(" ")[0];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = find((await params).id);
  if (!c) return { title: "Not found" };
  const title = `Chat with ${first(c.name)}, ${c.age} · AI companion`;
  const description = `${c.tagline || `Meet ${first(c.name)}`} — ${first(c.name)} is a ${pretty(c.personality)} AI ${pretty(c.occupation)} who chats in English, Hindi and Hinglish and remembers you. 10 free messages.`;
  return { title, description, alternates: { canonical: `/girls/${c.id}` }, openGraph: { title, description, images: [`/api/portraits/${c.id}?w=640`] } };
}

export default async function Girl({ params }: { params: Promise<{ id: string }> }) {
  const c = find((await params).id);
  if (!c) notFound();
  const others = listFeatured({ category: "girls" }).filter((x) => x.id !== c.id).slice(0, 6);
  const name = first(c.name);
  return (
    <main style={{ maxWidth: 980 }}>
      <nav className="muted" style={{ fontSize: 13, margin: "8px 0 14px" }}><Link href="/">Home</Link> › <Link href="/girls">AI companions</Link> › {name}</nav>
      <div className="girl-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/portraits/${c.id}?w=640`} alt={`${c.name}, AI-generated companion`} />
        <div>
          <h1 style={{ margin: "0 0 4px" }}>{c.name}, {c.age}</h1>
          <p className="script" style={{ fontSize: 20, margin: "0 0 10px" }}>{c.tagline}</p>
          <p>{c.backstory}</p>
          <ul className="girl-facts">
            <li><b>Personality:</b> {pretty(c.personality)}</li>
            <li><b>Job:</b> {pretty(c.occupation)}</li>
            <li><b>Look:</b> {pretty(c.hair)} hair, {pretty(c.eyes)} eyes, {pretty(c.bodyShape ?? c.build)} figure</li>
            {c.hobbies.length > 0 && <li><b>Loves:</b> {c.hobbies.join(", ")}</li>}
            <li><b>Speaks:</b> English, Hindi &amp; Hinglish</li>
          </ul>
          <Link href={`/chat?c=${c.id}`} className="btn btn-gold" style={{ fontSize: 18, padding: "14px 28px" }}>💬 Chat with {name} free</Link>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>{name} is a fictional, AI-generated adult character. 18+ only.</p>
        </div>
      </div>
      <h2 style={{ marginTop: 36 }}>More AI companions</h2>
      <div className="girl-more">
        {others.map((o) => (
          <Link key={o.id} href={`/girls/${o.id}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/portraits/${o.id}?w=400`} alt={`${o.name}, AI companion`} loading="lazy" />
            <span>{first(o.name)}, {o.age}</span>
          </Link>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://flirtiq.online/" }, { "@type": "ListItem", position: 2, name: "AI companions", item: "https://flirtiq.online/girls" }, { "@type": "ListItem", position: 3, name, item: `https://flirtiq.online/girls/${c.id}` }] }) }} />
    </main>
  );
}
