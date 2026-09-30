/**
 * Post-generation scanning. Every output passes ALL checks before a user can see it.
 * Fails closed: if a scanner errors or isn't configured in production, the output is blocked.
 */
export interface ScanReport {
  /** Hash match against a known-CSAM database (PhotoDNA / Thorn Safer). */
  csamMatch: boolean;
  /** Lowest apparent age among detected people, from an age-estimation model. null = no person detected. */
  minApparentAge: number | null;
  /** Highest face similarity (0..1) against a public-figure reference set. */
  realPersonSimilarity: number;
}

export interface SafetyScanner {
  scan(url: string, mimeType: string): Promise<ScanReport>;
}

/** Buffer above 18 because age estimators are imprecise. */
export const MIN_APPARENT_AGE = Number(process.env.MIN_APPARENT_AGE ?? 21);
export const MAX_REAL_PERSON_SIMILARITY = Number(process.env.MAX_REAL_PERSON_SIMILARITY ?? 0.6);

export type Verdict =
  | { ok: true }
  | { ok: false; category: "csam" | "minor_appearance" | "real_person" | "scan_error"; detail: string };

export function judge(r: ScanReport): Verdict {
  if (r.csamMatch) return { ok: false, category: "csam", detail: "hash match" };
  if (r.minApparentAge !== null && r.minApparentAge < MIN_APPARENT_AGE)
    return { ok: false, category: "minor_appearance", detail: `apparent age ${r.minApparentAge}` };
  if (r.realPersonSimilarity > MAX_REAL_PERSON_SIMILARITY)
    return { ok: false, category: "real_person", detail: `similarity ${r.realPersonSimilarity}` };
  return { ok: true };
}

/** Dev only: reports every output as safe. */
export const mockScanner: SafetyScanner = {
  async scan() {
    return { csamMatch: false, minApparentAge: 30, realPersonSimilarity: 0 };
  },
};

/** POSTs { url, mimeType } to SAFETY_ENDPOINT, which runs your hash-match, age and face models. */
export function remoteScanner(endpoint: string, apiKey: string): SafetyScanner {
  return {
    async scan(url, mimeType) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ url, mimeType }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`safety backend ${res.status}`);
      const b = (await res.json()) as ScanReport;
      if (typeof b.csamMatch !== "boolean" || typeof b.realPersonSimilarity !== "number") throw new Error("bad scan payload");
      return b;
    },
  };
}

export function getScanner(): SafetyScanner {
  const s = process.env.SAFETY_SCANNER ?? "mock";
  if (s === "mock") {
    if (process.env.NODE_ENV === "production") throw new Error("A real SAFETY_SCANNER is required in production");
    return mockScanner;
  }
  if (s === "remote") {
    const { SAFETY_ENDPOINT, SAFETY_API_KEY } = process.env;
    if (!SAFETY_ENDPOINT || !SAFETY_API_KEY) throw new Error("SAFETY_ENDPOINT and SAFETY_API_KEY are required");
    return remoteScanner(SAFETY_ENDPOINT, SAFETY_API_KEY);
  }
  throw new Error(`Unknown SAFETY_SCANNER: ${s}`);
}

/** Runs the scan and converts any error into a block. */
export async function scanFailClosed(scanner: () => SafetyScanner, url: string, mimeType: string): Promise<Verdict> {
  try {
    return judge(await scanner().scan(url, mimeType));
  } catch (e) {
    return { ok: false, category: "scan_error", detail: e instanceof Error ? e.message : String(e) };
  }
}
