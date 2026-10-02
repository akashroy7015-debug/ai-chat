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
export function Portrait({ c, height = 220, round = 12 }: { c: AvatarChar & { portraitV?: number }; height?: number | string; round?: number }) {
  const h = HAIR_HEX[c.hair] ?? "#555";
  const [failed, setFailed] = useState(false);
  if (c.id && !failed) {
    return (
      <div style={{ height, borderRadius: round, overflow: "hidden", background: `linear-gradient(160deg, ${h}, #2b1830 70%)`, position: "relative" }}>
        <img src={`/api/portraits/${c.id}${c.portraitV ? `?v=${c.portraitV}` : ""}`} alt={`${c.name} (AI-generated)`} loading="lazy" onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} />
        {c.style === "anime" && <span style={{ position: "absolute", top: 8, left: 8, fontSize: 11, background: "rgba(0,0,0,.5)", padding: "2px 8px", borderRadius: 999 }}>ANIME</span>}
      </div>
    );
  }
  return <Avatar c={c} height={height} round={round} />;
}

/** Site name; set NEXT_PUBLIC_BRAND at build time to rename. */
export const BRAND = process.env.NEXT_PUBLIC_BRAND ?? "Sizzly";

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

/** Sizzly wordmark: flame + lowercase heavy type, "ly" in a hot pink→orange gradient. */
export function Logo({ size = 26 }: { size?: number }) {
  const gid = `flame${useId().replace(/:/g, "")}`;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.18, fontWeight: 900, fontSize: size, letterSpacing: "-0.04em", lineHeight: 1 }}>
      <svg width={size * 0.95} height={size * 1.15} viewBox="0 0 24 30" aria-hidden="true">
        <defs><linearGradient id={gid} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ff2d78" /><stop offset=".6" stopColor="#ff5a3c" /><stop offset="1" stopColor="#ffb347" /></linearGradient></defs>
        <path d="M12 1c1 5 7 8 7 15a7 7 0 0 1-14 0c0-4 2-6 4-8 0 3 1 5 3 5-2-4-1-8 0-12z" fill={`url(#${gid})`} />
        <path d="M12 16c.5 2.5 3 3.5 3 6.5a3 3 0 0 1-6 0c0-2 1.5-3 3-6.5z" fill="#fff" opacity=".9" />
      </svg>
      <span style={{ color: "#fff" }}>sizz</span>
      <span style={{ marginLeft: "-0.18em", background: "linear-gradient(90deg,#ff2d78,#ff5a3c 60%,#ffb347)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>ly</span>
    </span>
  );
}
