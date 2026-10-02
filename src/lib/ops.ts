import fs from "node:fs";
import path from "node:path";
import { stats } from "./admin";
import { feedbackSummary } from "./feedback";
import { db } from "./store";

const DAY = 86_400_000;

/** Machine-readable status for the maintenance agent. Contains no emails, passwords or user messages. */
export function opsReport(now = Date.now()) {
  const errors: Record<string, number> = {};
  const samples: { kind: string; detail: string; at: number }[] = [];
  for (const a of db.audit) {
    if (a.at < now - DAY || !/error|failed|blocked/.test(a.kind)) continue;
    errors[a.kind] = (errors[a.kind] ?? 0) + 1;
    if (/error|failed/.test(a.kind)) samples.push({ kind: a.kind, detail: a.detail.slice(0, 200), at: a.at });
  }
  let lastUpdate: unknown = null;
  try {
    const dir = path.dirname(process.env.DB_PATH ?? path.join(process.cwd(), "data", "app.db"));
    lastUpdate = JSON.parse(fs.readFileSync(path.join(dir, "deploy-status.json"), "utf8"));
  } catch {}
  return {
    commit: process.env.BUILD_COMMIT ?? "unknown",
    lastUpdate,
    stats: stats(now),
    errors24h: errors,
    errorSamples: samples.slice(-20),
    feedback7d: feedbackSummary(now - 7 * DAY),
    config: {
      llm: process.env.LLM_PROVIDER ?? "mock",
      model: process.env.LLM_MODEL ?? process.env.OPENAI_MODEL ?? "default",
      moderation: process.env.OPENAI_MODERATION === "true",
      voice: !!process.env.OPENAI_API_KEY && process.env.VOICE_ENABLED !== "false",
      images: process.env.IMAGE_PROVIDER ?? (process.env.OPENAI_API_KEY ? "openai" : "none"),
    },
  };
}
