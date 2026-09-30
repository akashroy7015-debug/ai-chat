"use client";
import { useState, type CSSProperties } from "react";
import { Avatar, type AvatarChar } from "./avatar";

export interface CharacterCard {
  id: string;
  name: string;
  age: number;
  gender: string;
  style: string;
  ethnicity: string;
  hair: string;
  occupation: string;
  personality: string;
  tagline: string;
  bodyShape?: string;
  outfit?: string;
  featured?: boolean;
}

export const theme = { bg: "#0f0f14", card: "#1a1a22", line: "#2a2a35", accent: "#e0457b", text: "#eee", muted: "#9a9aa8" };

export const btn: CSSProperties = { padding: "10px 16px", borderRadius: 10, border: "none", background: theme.accent, color: "#fff", cursor: "pointer", fontWeight: 600 };
export const chip = (on: boolean): CSSProperties => ({
  padding: "6px 12px", borderRadius: 999, border: `1px solid ${on ? theme.accent : theme.line}`,
  background: on ? theme.accent : "transparent", color: on ? "#fff" : theme.text, cursor: "pointer", fontSize: 13,
});
export const field: CSSProperties = { padding: 10, borderRadius: 8, border: `1px solid ${theme.line}`, background: theme.card, color: theme.text };

const HAIR_HEX: Record<string, string> = { black: "#222", brown: "#6b4226", blonde: "#d8b35a", red: "#b33a2a", auburn: "#8a3b1e", silver: "#b9bcc4", pink: "#e27aa8", blue: "#3b6fd1" };

/** Placeholder portrait until image generation is wired up: gradient seeded by hair colour. */
export function Portrait({ c, height = 220 }: { c: AvatarChar & { portraitV?: number }; height?: number }) {
  const h = HAIR_HEX[c.hair] ?? "#555";
  const [failed, setFailed] = useState(false);
  if (c.id && !failed) {
    return (
      <div style={{ height, borderRadius: 12, overflow: "hidden", background: `linear-gradient(160deg, ${h}, #2b1830 70%)`, position: "relative" }}>
        <img src={`/api/portraits/${c.id}${c.portraitV ? `?v=${c.portraitV}` : ""}`} alt={`${c.name} (AI-generated)`} loading="lazy" onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} />
        {c.style === "anime" && <span style={{ position: "absolute", top: 8, left: 8, fontSize: 11, background: "rgba(0,0,0,.5)", padding: "2px 8px", borderRadius: 999 }}>ANIME</span>}
      </div>
    );
  }
  return <Avatar c={c} height={height} />;
}

export const pretty = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
