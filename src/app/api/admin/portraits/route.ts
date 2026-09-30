import { requireAdmin } from "@/lib/admin";
import { featuredJobStatus, portraitsEnabled, startFeaturedPortraits } from "@/lib/portraits";
import { authed, body, json } from "@/lib/http";

export const GET = authed(async (_req, userId) => {
  requireAdmin(userId);
  return json({ enabled: portraitsEnabled(), ...featuredJobStatus() });
});

export const POST = authed(async (req, userId) => {
  requireAdmin(userId);
  if (!portraitsEnabled()) return json({ error: "Set LLM_PROVIDER=openai and OPENAI_API_KEY first." }, 400);
  const { regenerateAll } = await body<{ regenerateAll: boolean }>(req);
  const { done: _d, ...status } = startFeaturedPortraits(userId, regenerateAll === true) as ReturnType<typeof featuredJobStatus> & { done?: unknown };
  return json(status);
});
