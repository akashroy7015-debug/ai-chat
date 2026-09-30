/**
 * Image/video generation backends. The self-hosted adapter talks to your own GPU server
 * (e.g. a ComfyUI / diffusers worker) over a small HTTP contract documented in README.
 */
export type MediaKind = "image" | "video";
export type ContentLevel = "sfw" | "adult";

export interface GenerateRequest {
  kind: MediaKind;
  prompt: string;
  negativePrompt: string;
  contentLevel: ContentLevel;
  seed: number;
}

export interface GenerateResult {
  url: string;
  mimeType: string;
}

export interface MediaProvider {
  generate(req: GenerateRequest): Promise<GenerateResult>;
}

/** Dev placeholder: an SVG card, so the full flow runs without a GPU. */
export const mockMedia: MediaProvider = {
  async generate({ kind, seed }) {
    const hue = seed % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="640"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},60%,45%)"/><stop offset="1" stop-color="#1b1020"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" fill="#fff" font-size="28" text-anchor="middle" font-family="sans-serif">${kind === "video" ? "VIDEO" : "IMAGE"} (mock)</text><text x="50%" y="95%" fill="#fff" font-size="14" text-anchor="middle" opacity=".7">AI-generated</text></svg>`;
    return { url: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, mimeType: "image/svg+xml" };
  },
};

/** POSTs to MEDIA_ENDPOINT with a bearer key; expects { url, mimeType } back. */
export function selfHosted(endpoint: string, apiKey: string, timeoutMs = 180_000): MediaProvider {
  return {
    async generate(req) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(req),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`media backend ${res.status}`);
      const body = (await res.json()) as Partial<GenerateResult>;
      if (typeof body.url !== "string" || typeof body.mimeType !== "string") throw new Error("media backend returned bad payload");
      return { url: body.url, mimeType: body.mimeType };
    },
  };
}

export function getMediaProvider(): MediaProvider {
  const p = process.env.MEDIA_PROVIDER ?? "mock";
  if (p === "mock") {
    if (process.env.NODE_ENV === "production" && !process.env.MEDIA_PROVIDER) throw new Error("MEDIA_PROVIDER must be configured in production");
    return mockMedia;
  }
  if (p === "self_hosted") {
    const { MEDIA_ENDPOINT, MEDIA_API_KEY } = process.env;
    if (!MEDIA_ENDPOINT || !MEDIA_API_KEY) throw new Error("MEDIA_ENDPOINT and MEDIA_API_KEY are required");
    return selfHosted(MEDIA_ENDPOINT, MEDIA_API_KEY);
  }
  throw new Error(`Unknown MEDIA_PROVIDER: ${p}`);
}
