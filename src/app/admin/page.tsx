"use client";
import { useEffect, useState } from "react";
import { btn, field, theme } from "../ui";

type Stats = Record<string, number>;
interface U { id: string; email: string; ageStatus: string; idCountry?: string; banned: boolean; strikes: number; balance: number; messages: number; createdAt?: number }
interface R { id: string; email?: string; kind: string; scene: string; url?: string; reviewed: boolean; reason: string; createdAt: number }
interface A { at: number; email?: string; kind: string; category?: string; detail: string }

const card = { background: theme.card, borderRadius: 12, padding: 12 } as const;
const small = { ...btn, padding: "4px 10px", fontSize: 12 } as const;
const when = (t?: number) => (t ? new Date(t).toLocaleString() : "");

export default function Admin() {
  const [tab, setTab] = useState<"overview" | "users" | "reports" | "log">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<U[]>([]);
  const [q, setQ] = useState("");
  const [reports, setReports] = useState<R[]>([]);
  const [log, setLog] = useState<A[]>([]);
  const [err, setErr] = useState("");
  const [pj, setPj] = useState<{ enabled: boolean; running: boolean; done: number; failed: number; total: number; missing: number; lastError: string } | null>(null);
  const loadPj = async () => { const r = await fetch("/api/admin/portraits"); if (r.ok) setPj(await r.json()); };
  useEffect(() => { void loadPj(); }, []);
  useEffect(() => { if (!pj?.running) return; const t = setTimeout(() => void loadPj(), 3000); return () => clearTimeout(t); }, [pj]);

  async function get<T>(url: string): Promise<T | null> {
    const r = await fetch(url);
    if (!r.ok) { setErr(r.status === 404 ? "Admins only. Add your email to ADMIN_EMAILS on the server." : (await r.json()).error); return null; }
    return r.json();
  }
  async function post(url: string, body: unknown) {
    const r = await fetch(url, { method: "POST", body: JSON.stringify(body) });
    if (!r.ok) alert((await r.json()).error);
  }
  const load = async () => {
    const s = await get<Stats>("/api/admin/stats"); if (s) setStats(s);
    const u = await get<{ users: U[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`); if (u) setUsers(u.users);
    const r = await get<{ reports: R[] }>("/api/admin/reports"); if (r) setReports(r.reports);
    const l = await get<{ audit: A[] }>("/api/admin/audit"); if (l) setLog(l.audit);
  };
  useEffect(() => { void load(); }, []);

  if (err) return <main><h1>Admin</h1><p style={{ color: "#ff8a8a" }}>{err}</p></main>;

  return (
    <main>
      <h1>Admin</h1>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <a href="/admin/models"><button style={{ ...btn, background: "#7a3cff" }}>💃 Models</button></a>
        {(["overview", "users", "reports", "log"] as const).map((t) => (
          <button key={t} style={{ ...btn, background: tab === t ? theme.accent : "#333" }} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}{t === "reports" && stats?.openReports ? ` (${stats.openReports})` : ""}
          </button>
        ))}
      </div>

      {tab === "overview" && pj && (
        <div style={{ ...card, marginBottom: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <b>Character pictures</b>
          <span style={{ color: theme.muted, fontSize: 13 }}>
            {!pj.enabled ? "Needs OpenAI configured." : pj.running ? `Generating ${pj.done + pj.failed}/${pj.total}…` : `${pj.missing} featured characters without a picture.`}
            {pj.failed > 0 && ` ${pj.failed} failed: ${pj.lastError}`}
          </span>
          {pj.enabled && !pj.running && pj.missing > 0 && <button style={small} onClick={async () => { await post("/api/admin/portraits", {}); void loadPj(); }}>Generate missing (~$0.05 each)</button>}
          {pj.enabled && !pj.running && pj.missing === 0 && <button style={{ ...small, background: "#333" }} onClick={async () => { if (confirm("Regenerate ALL featured pictures? This costs OpenAI credit.")) { await post("/api/admin/portraits", { regenerateAll: true }); void loadPj(); } }}>Regenerate all</button>}
        </div>
      )}
      {tab === "overview" && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} style={card}><div style={{ color: theme.muted, fontSize: 12 }}>{k.replace(/([A-Z0-9]+)/g, " $1")}</div><div style={{ fontSize: 26, fontWeight: 700 }}>{k === "revenueUsd" ? `$${v}` : v}</div></div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <>
          <form onSubmit={(e) => { e.preventDefault(); void load(); }} style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <input style={{ ...field, flex: 1 }} placeholder="Search email" value={q} onChange={(e) => setQ(e.target.value)} />
            <button style={btn}>Search</button>
          </form>
          <div style={{ display: "grid", gap: 6 }}>
            {users.map((u) => (
              <div key={u.id} style={{ ...card, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <b>{u.email}</b> {u.banned && <span style={{ color: "#ff8a8a" }}>BANNED</span>}
                  <div style={{ fontSize: 12, color: theme.muted }}>{u.ageStatus}{u.idCountry ? ` · ${u.idCountry}` : ""} · {u.balance} tokens · {u.messages} msgs · strikes {u.strikes} · joined {when(u.createdAt)}</div>
                </div>
                <button style={small} onClick={async () => { const n = Number(prompt("Tokens to grant?", "50")); if (n > 0) { await post("/api/admin/users", { userId: u.id, action: "grant", amount: n }); void load(); } }}>+ Tokens</button>
                <button style={{ ...small, background: u.banned ? "#2a7" : "#a33" }} onClick={async () => { if (confirm(`${u.banned ? "Unban" : "Ban"} ${u.email}?`)) { await post("/api/admin/users", { userId: u.id, action: u.banned ? "unban" : "ban" }); void load(); } }}>{u.banned ? "Unban" : "Ban"}</button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "reports" && (
        <div style={{ display: "grid", gap: 8 }}>
          {reports.length === 0 && <p style={{ color: theme.muted }}>No reports.</p>}
          {reports.map((r) => (
            <div key={r.id} style={{ ...card, display: "flex", gap: 12, alignItems: "center", opacity: r.reviewed ? 0.5 : 1 }}>
              {r.url ? <img src={r.url} alt="" style={{ width: 80, borderRadius: 8 }} /> : <div style={{ width: 80 }}>(no media)</div>}
              <div style={{ flex: 1 }}>
                <div><b>{r.email}</b> · {r.kind} · {r.scene} {r.reviewed && "· reviewed"}</div>
                <div style={{ fontSize: 13, color: theme.muted }}>Reason: {r.reason || "(none)"} · {when(r.createdAt)}</div>
              </div>
              {!r.reviewed && <>
                <button style={{ ...small, background: "#a33" }} onClick={async () => { await post("/api/admin/reports", { id: r.id, restore: false }); void load(); }}>Keep removed</button>
                <button style={{ ...small, background: "#333" }} onClick={async () => { await post("/api/admin/reports", { id: r.id, restore: true }); void load(); }}>Restore</button>
              </>}
            </div>
          ))}
        </div>
      )}

      {tab === "log" && (
        <div style={{ ...card, fontFamily: "ui-monospace, monospace", fontSize: 12, overflowX: "auto" }}>
          {log.map((a, i) => (
            <div key={i} style={{ color: /blocked|ban|csam/.test(a.kind) ? "#ff8a8a" : theme.text }}>
              {when(a.at)} · {a.email ?? "-"} · {a.kind}{a.category ? `/${a.category}` : ""} · {a.detail.slice(0, 120)}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
