"use client";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
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
  createdAt?: number;
  /** Set when the model has a looping video clip. */
  clipV?: number;
  bodyShape?: string;
  outfit?: string;
  featured?: boolean;
}

export const theme = { bg: "#0e0b0e", card: "#181418", line: "#2f292f", accent: "#e85d80", text: "#f7f3f6", muted: "#a79ca5" };

export const btn: CSSProperties = { padding: "10px 16px", borderRadius: 10, border: "none", background: theme.accent, color: "#fff", cursor: "pointer", fontWeight: 600 };
export const chip = (on: boolean): CSSProperties => ({
  padding: "6px 12px", borderRadius: 999, border: `1px solid ${on ? theme.accent : theme.line}`,
  background: on ? theme.accent : "transparent", color: on ? "#fff" : theme.text, cursor: "pointer", fontSize: 13,
});
export const field: CSSProperties = { padding: 10, borderRadius: 8, border: `1px solid ${theme.line}`, background: theme.card, color: theme.text };

const HAIR_HEX: Record<string, string> = { black: "#222", brown: "#6b4226", blonde: "#d8b35a", red: "#b33a2a", auburn: "#8a3b1e", silver: "#b9bcc4", pink: "#e27aa8", blue: "#3b6fd1" };

/** Placeholder portrait until image generation is wired up: gradient seeded by hair colour. */
/** `height` may be a number of pixels or "100%" to fill a positioned parent (cards, hero). */
export function Portrait({ c, height = 220, round = 12, w }: { c: AvatarChar & { portraitV?: number }; height?: number | string; round?: number; w?: number }) {
  const width = w ?? (round >= 999 ? 192 : 640);
  const h = HAIR_HEX[c.hair] ?? "#555";
  const [failed, setFailed] = useState(false);
  if (c.id && !failed) {
    return (
      <div style={{ height, borderRadius: round, overflow: "hidden", background: `linear-gradient(160deg, ${h}, #2b1830 70%)`, position: "relative" }}>
        <img src={`/api/portraits/${c.id}?w=${width}${c.portraitV ? `&v=${c.portraitV}` : ""}`} decoding="async" alt={`${c.name} (AI-generated)`} loading="lazy" onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} />
        {c.style === "anime" && <span style={{ position: "absolute", top: 8, left: 8, fontSize: 11, background: "rgba(0,0,0,.5)", padding: "2px 8px", borderRadius: 999 }}>ANIME</span>}
      </div>
    );
  }
  return <Avatar c={c} height={height} round={round} />;
}

/** Site name; set NEXT_PUBLIC_BRAND at build time to rename. */
export const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "FlirtIQ";

export const pretty = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

/** Looping, silent card video. Sets `muted` as a real attribute and calls play(), which iPhone Safari needs to autoplay. */
export function ClipVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    const tryPlay = () => void v.play().catch(() => {});
    tryPlay();
    v.addEventListener("loadeddata", tryPlay);
    return () => v.removeEventListener("loadeddata", tryPlay);
  }, [src]);
  return <video ref={ref} className={className} src={src} autoPlay muted loop playsInline preload="auto" />;
}

/** FlirtIQ wordmark: heavy lowercase "flirtiq" where a pink heart replaces the dot of the last "i". */
export function Logo({ size = 26 }: { size?: number }) {
  const heart = size * 0.36;
  return (
    <span aria-label="FlirtIQ" style={{ display: "inline-flex", alignItems: "baseline", fontWeight: 900, fontSize: size, letterSpacing: "-0.05em", lineHeight: 1, color: "#fff", paddingTop: size * 0.12 }}>
      <span aria-hidden="true">flirt</span>
      <span aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>
        ı
        <svg width={heart} height={heart * 0.92} viewBox="0 0 24 22" style={{ position: "absolute", left: "50%", top: -heart * 0.38, transform: "translateX(-50%) rotate(-8deg)" }}>
          <path d="M12 21.6 10.3 20C4.2 14.5 0 10.8 0 6.3 0 2.7 2.8 0 6.4 0c2 0 4 .9 5.6 2.4C13.6.9 15.6 0 17.6 0 21.2 0 24 2.7 24 6.3c0 4.5-4.2 8.2-10.3 13.7z" fill="#ff4d6a" />
        </svg>
      </span>
      <span aria-hidden="true">q</span>
    </span>
  );
}
