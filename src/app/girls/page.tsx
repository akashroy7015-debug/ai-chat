import type { Metadata } from "next";
import Link from "next/link";
import { listFeatured } from "@/lib/characters/featured";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "AI girlfriends & companions you can chat with",
  description: "Browse FlirtIQ's AI companions: desi, mature, latina, asian and anime characters who flirt, remember you and reply in English, Hindi and Hinglish. 10 free messages.",
  alternates: { canonical: "/girls" },
};

export default function Girls() {
  const all = listFeatured().filter((c) => c.gender === "female");
  return (
    <main style={{ maxWidth: 1100 }}>
      <h1 style={{ marginBottom: 6 }}>Meet your AI companions</h1>
      <p className="muted" style={{ marginTop: 0 }}>Every character is a fictional adult created by AI. Pick one and start chatting free.</p>
      <div className="girl-more big">
        {all.map((c) => (
          <Link key={c.id} href={`/girls/${c.id}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/portraits/${c.id}?w=400`} alt={`${c.name}, AI companion`} loading="lazy" />
            <span>{c.name.split(" ")[0]}, {c.age}</span>
            <small className="muted">{c.tagline}</small>
          </Link>
        ))}
      </div>
    </main>
  );
}
