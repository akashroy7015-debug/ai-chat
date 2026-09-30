import { explicitAllowed, requireVerifiedAdult } from "../age/verification";
import { describeAppearance, NEGATIVE_PROMPT } from "../characters/appearance";
import { ensureFeatured } from "../characters/featured";
import { canChatWith } from "../characters/schema";
import { credit, spend } from "../tokens/ledger";
import { audit, db, newId, saveUser } from "../store";
import { AccessDenied } from "../age/verification";
import { PMap } from "../store";
import { getMediaProvider, type MediaKind, type MediaProvider } from "./provider";
import { getScanner, scanFailClosed, type SafetyScanner } from "./safety";

export const MEDIA_COSTS: Record<MediaKind, number> = { image: 20, video: 80 };

/** Fixed scene presets. Users pick one; there is no free-text prompt into the image model. */
export const SCENES = {
  portrait: "studio portrait, soft lighting",
  selfie: "casual phone selfie",
  beach: "at the beach, golden hour",
  city_night: "city street at night, neon lights",
  bedroom: "cozy bedroom, warm lamp light",
  gym: "modern gym",
  restaurant: "candlelit restaurant",
  pool: "by a rooftop pool",
} as const;
export type Scene = keyof typeof SCENES;

export type JobStatus = "queued" | "generating" | "checking" | "ready" | "blocked" | "failed";

export interface MediaJob {
  id: string;
  userId: string;
  characterId: string;
  kind: MediaKind;
  scene: Scene;
  status: JobStatus;
  url?: string;
  mimeType?: string;
  /** Always true: every output is labelled as AI-generated. */
  aiGenerated: true;
  hidden: boolean;
  createdAt: number;
  /** Background promise; internal, used by tests. */
  done?: Promise<void>;
}

const g = globalThis as unknown as { __media?: PMap<MediaJob> };
export const mediaJobs: PMap<MediaJob> = (g.__media ??= new PMap<MediaJob>(db.sql, "media"));
const saveJob = (j: MediaJob) => mediaJobs.save(j.id);

export interface Deps {
  provider: () => MediaProvider;
  scanner: () => SafetyScanner;
}
const defaultDeps: Deps = { provider: getMediaProvider, scanner: getScanner };

/** Charges up front, then generates in the background. Tokens are refunded if the output is blocked or fails. */
export async function requestMedia(
  userId: string,
  characterId: string,
  kind: MediaKind,
  scene: Scene,
  deps: Deps = defaultDeps,
): Promise<MediaJob> {
  const user = requireVerifiedAdult(userId);
  if (!(scene in SCENES)) throw new AccessDenied("banned", "Unknown scene.", 400);
  ensureFeatured();
  const character = db.characters.get(characterId);
  if (!character || !canChatWith(character, userId)) throw new AccessDenied("banned", "Character not found.", 404);

  const cost = MEDIA_COSTS[kind];
  spend(userId, cost, `media:${kind}`);

  const job: MediaJob = {
    id: newId(), userId, characterId, kind, scene, status: "queued", aiGenerated: true, hidden: false, createdAt: Date.now(),
  };
  mediaJobs.set(job.id, job);

  const prompt = `${describeAppearance(character)}, ${SCENES[scene]}`;
  const contentLevel = explicitAllowed(user) ? "adult" : "sfw";

  const run = async () => {
    try {
      job.status = "generating";
      saveJob(job);
      const out = await deps.provider().generate({
        kind, prompt, negativePrompt: NEGATIVE_PROMPT, contentLevel, seed: Math.floor(Math.random() * 2 ** 31),
      });
      job.status = "checking";
      saveJob(job);
      const verdict = await scanFailClosed(deps.scanner, out.url, out.mimeType);
      if (!verdict.ok) {
        job.status = "blocked";
        saveJob(job);
        credit(userId, cost, `refund:${job.id}`);
        audit({ userId, kind: "media_blocked", category: verdict.category, detail: `${job.id} ${verdict.detail}` });
        if (verdict.category === "csam") {
          // Must be escalated to a human trust & safety reviewer and reported per law (e.g. NCMEC in the US).
          user.banned = true;
          saveUser(user);
          audit({ userId, kind: "csam_escalation_required", category: "csam", detail: job.id });
        }
        return;
      }
      job.url = out.url;
      job.mimeType = out.mimeType;
      job.status = "ready";
      saveJob(job);
      audit({ userId, kind: "media_ready", detail: job.id });
    } catch (e) {
      job.status = "failed";
      saveJob(job);
      credit(userId, cost, `refund:${job.id}`);
      audit({ userId, kind: "media_failed", detail: `${job.id} ${e instanceof Error ? e.message : e}` });
    }
  };
  job.done = run();
  return job;
}

/** Only the owner sees their jobs; URLs are only exposed for ready, non-hidden items. */
export function listMedia(userId: string, characterId?: string) {
  return [...mediaJobs.values()]
    .filter((j) => j.userId === userId && !j.hidden && (!characterId || j.characterId === characterId))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(({ done: _d, userId: _u, ...j }) => (j.status === "ready" ? j : { ...j, url: undefined }));
}

/** Takedown: the item is hidden immediately and queued for review (48h SLA). */
export function reportMedia(userId: string, jobId: string, reason: string) {
  const job = mediaJobs.get(jobId);
  if (!job || job.userId !== userId) throw new AccessDenied("banned", "Not found.", 404);
  job.hidden = true;
  saveJob(job);
  audit({ userId, kind: "media_reported", detail: `${jobId} ${reason.slice(0, 200)}` });
}
