"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Portrait, theme } from "../ui";
import { useT } from "../i18n";

interface Conv { character: { id: string; name: string; age: number; hair: string; style: string }; last: { role: string; content: string; at: number } }

export default function Chats() {
  const { t } = useT();
  const [convs, setConvs] = useState<Conv[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    void fetch("/api/conversations").then(async (r) => {
      const b = await r.json();
      if (r.ok) setConvs(b.conversations); else setErr(b.error);
    });
  }, []);
  return (
    <main>
      <h1>{t("chats")}</h1>
      {err && <p style={{ color: "#ff8a8a" }}>{err} <Link href="/" style={{ color: theme.accent }}>Go home</Link></p>}
      {convs?.length === 0 && <p style={{ color: theme.muted }}>{t("noChats")} <Link href="/" style={{ color: theme.accent }}>{t("pickChar")}</Link>.</p>}
      <div style={{ display: "grid", gap: 8 }}>
        {convs?.map((c) => (
          <Link key={c.character.id} href={`/chat?c=${c.character.id}`} style={{ display: "flex", gap: 12, alignItems: "center", background: theme.card, padding: 10, borderRadius: 12, color: "inherit", textDecoration: "none" }}>
            <div style={{ width: 56 }}><Portrait c={c.character} height={56} w={192} /></div>
            <div style={{ minWidth: 0 }}>
              <b>{c.character.name}</b>
              <div style={{ color: theme.muted, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.last.role === "user" ? "You: " : ""}{c.last.content}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
