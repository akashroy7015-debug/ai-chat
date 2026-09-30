"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const btn = { padding: "8px 14px", borderRadius: 8, border: "none", background: "#e0457b", color: "#fff", cursor: "pointer" } as const;

export default function Home() {
  const [status, setStatus] = useState<string>("loading");
  const [balance, setBalance] = useState<number | null>(null);

  async function refresh() {
    const a = await (await fetch("/api/verify-age")).json();
    setStatus(a.ageStatus);
    setBalance((await (await fetch("/api/tokens")).json()).balance);
  }
  useEffect(() => { void refresh(); }, []);

  async function verify() {
    await fetch("/api/verify-age", { method: "POST", body: JSON.stringify({}) });
    // Dev mock: completes instantly. A real provider redirects to its hosted flow, then calls back.
    await fetch("/api/verify-age", { method: "POST", body: JSON.stringify({ action: "complete" }) });
    await refresh();
  }

  return (
    <main>
      <h1>AI Chat</h1>
      <p>18+ only. Every character is a fictional adult.</p>
      {status !== "verified" ? (
        <section>
          <p>You must verify you are 18 or older to continue.</p>
          <button style={btn} onClick={verify}>Verify my age (dev mock)</button>
        </section>
      ) : (
        <section>
          <p>Age verified. Tokens: <b>{balance}</b></p>
          <Link href="/chat"><button style={btn}>Open chat</button></Link>
        </section>
      )}
    </main>
  );
}
