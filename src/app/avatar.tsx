import type { ReactElement } from "react";
/**
 * Free illustrated avatar drawn from a character's attributes. Used until a real picture exists.
 * Always head-and-shoulders and clothed.
 */
export interface AvatarChar {
  id?: string; name: string; gender?: string; style?: string; ethnicity?: string; hair: string;
  hairStyle?: string; eyes?: string; outfit?: string; age?: number;
}

const SKIN: Record<string, string> = {
  caucasian: "#f2cba8", latina: "#d9a77c", asian: "#efc59c", arab: "#d4a178",
  african: "#8a5636", south_asian: "#b97c55", mixed: "#c99066",
};
const HAIR: Record<string, string> = {
  black: "#1b1512", brown: "#5a3620", blonde: "#e0bb62", red: "#b2381f", auburn: "#80341a",
  silver: "#c9ccd4", pink: "#ee7fb1", blue: "#3a6fd6",
};
const EYES: Record<string, string> = { brown: "#5b3a1e", blue: "#3b7bd4", green: "#3f9a58", hazel: "#8a6a2c", gray: "#7c8794" };
const OUTFIT: Record<string, string> = {
  short_dress: "#c2185b", bodycon_dress: "#1a1a1a", cocktail_dress: "#7b1fa2", evening_gown: "#a31515",
  crop_top_skirt: "#ec407a", bikini: "#1f9e8f", lingerie: "#6a1b4d", office_wear: "#37474f", casual: "#5c6bc0", gym_wear: "#222", bralette_top: "#b0306a", night_dress: "#8e5a9a",
};

function hash(s: string) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }

export function Avatar({ c, height }: { c: AvatarChar; height: number }) {
  const seed = hash(c.id ?? c.name);
  const male = c.gender === "male";
  const anime = c.style === "anime";
  const skin = SKIN[c.ethnicity ?? "mixed"] ?? SKIN.mixed;
  const hair = HAIR[c.hair] ?? "#3a2a20";
  const eye = EYES[c.eyes ?? "brown"] ?? EYES.brown;
  const cloth = OUTFIT[c.outfit ?? "casual"] ?? "#5c6bc0";
  const hs = male ? "short" : (c.hairStyle ?? "straight");
  const bg1 = `hsl(${seed % 360},45%,32%)`, bg2 = `hsl(${(seed + 60) % 360},40%,14%)`;
  const eyeR = anime ? 9 : 5.5, eyeY = anime ? 128 : 124;
  const gid = `g${seed}`;

  const backHair: Record<string, ReactElement | null> = {
    straight: <path d="M52 110 Q50 60 100 50 Q150 60 148 110 L154 230 L46 230 Z" fill={hair} />,
    bangs: <path d="M52 110 Q50 60 100 50 Q150 60 148 110 L152 225 L48 225 Z" fill={hair} />,
    wavy: <path d="M50 110 Q48 58 100 48 Q152 58 150 110 Q162 150 150 180 Q162 205 148 232 L52 232 Q38 205 50 180 Q38 150 50 110Z" fill={hair} />,
    curly: <g fill={hair}>{[[60, 90], [140, 90], [50, 130], [150, 130], [55, 170], [145, 170], [62, 205], [138, 205], [100, 55], [72, 62], [128, 62]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={24} />)}</g>,
    ponytail: <g fill={hair}><path d="M55 110 Q52 60 100 52 Q148 60 145 110 Z" /><path d="M140 80 Q180 110 160 190 Q150 150 140 120Z" /></g>,
    bun: <g fill={hair}><circle cx={100} cy={40} r={20} /><path d="M55 110 Q52 60 100 52 Q148 60 145 110 Z" /></g>,
    short: <path d={male ? "M60 100 Q58 58 100 52 Q142 58 140 100 Q132 78 100 76 Q68 78 60 100Z" : "M52 112 Q50 58 100 50 Q150 58 148 112 L146 150 L54 150Z"} fill={hair} />,
    braids: <g fill={hair}><path d="M55 110 Q52 60 100 52 Q148 60 145 110 Z" />{[62, 138].map((x) => <g key={x}>{[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={x} cy={130 + i * 22} rx={10} ry={13} />)}</g>)}</g>,
  };

  const neckline = c.outfit === "office_wear"
    ? <><path d="M40 260 Q45 205 100 200 Q155 205 160 260Z" fill={cloth} /><path d="M86 200 L100 228 L114 200" fill="#fff" /></>
    : c.outfit === "casual" || c.outfit === "gym_wear" || male
      ? <path d="M36 260 Q42 205 100 198 Q158 205 164 260Z" fill={cloth} />
      : <><path d="M40 260 Q46 214 72 208 L82 218 Q100 236 118 218 L128 208 Q154 214 160 260Z" fill={cloth} /><path d="M72 208 L76 190 M128 208 L124 190" stroke={cloth} strokeWidth={4} /></>;

  return (
    <svg viewBox="0 0 200 260" width="100%" height={height} preserveAspectRatio="xMidYMin slice" role="img" aria-label={`${c.name} (illustration)`} style={{ display: "block", borderRadius: 12 }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={bg1} /><stop offset="1" stopColor={bg2} /></linearGradient></defs>
      <rect width="200" height="260" fill={`url(#${gid})`} />
      {backHair[hs] ?? backHair.straight}
      <rect x="88" y="160" width="24" height="42" rx="10" fill={skin} />
      {neckline}
      <ellipse cx="100" cy="122" rx={male ? 40 : 37} ry={male ? 50 : 48} fill={skin} />
      {/* front hair */}
      {hs === "bangs"
        ? <path d="M62 112 Q60 70 100 66 Q140 70 138 112 Q128 96 100 96 Q72 96 62 112Z" fill={hair} />
        : hs !== "short" || !male
          ? <path d={`M62 105 Q66 ${70 + (seed % 8)} 100 70 Q136 ${72 + (seed % 6)} 138 105 Q124 84 100 84 Q78 86 62 105Z`} fill={hair} />
          : <path d="M62 102 Q64 72 100 70 Q136 72 138 102 Q124 84 100 84 Q76 84 62 102Z" fill={hair} />}
      {/* brows */}
      <path d={`M72 ${eyeY - 14} Q82 ${eyeY - 19} 91 ${eyeY - 14} M109 ${eyeY - 14} Q118 ${eyeY - 19} 128 ${eyeY - 14}`} stroke={hair} strokeWidth={male ? 3.5 : 2.5} fill="none" strokeLinecap="round" />
      {/* eyes */}
      {[82, 118].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={eyeY} rx={eyeR + 3} ry={eyeR} fill="#fff" />
          <circle cx={x} cy={eyeY} r={eyeR - 1} fill={eye} />
          <circle cx={x} cy={eyeY} r={(eyeR - 1) / 2.2} fill="#111" />
          <circle cx={x + 2} cy={eyeY - 2} r={anime ? 2.5 : 1.3} fill="#fff" />
          {!male && <path d={`M${x - eyeR - 3} ${eyeY - 2} Q${x} ${eyeY - eyeR - 5} ${x + eyeR + 3} ${eyeY - 2}`} stroke="#111" strokeWidth={2} fill="none" />}
        </g>
      ))}
      <path d="M100 132 Q97 144 101 147" stroke="rgba(0,0,0,.25)" strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d="M89 157 Q100 164 111 157 Q100 160 89 157Z" fill={male ? "#a0604a" : "#c2405a"} stroke={male ? "#a0604a" : "#c2405a"} strokeWidth={2} strokeLinejoin="round" />
      {!male && <><circle cx={78} cy={144} r={7} fill="#ff6f8f" opacity={0.18} /><circle cx={122} cy={144} r={7} fill="#ff6f8f" opacity={0.18} /></>}
      {anime && <text x="8" y="18" fontSize="11" fill="#fff" opacity={0.8}>ANIME</text>}
    </svg>
  );
}
