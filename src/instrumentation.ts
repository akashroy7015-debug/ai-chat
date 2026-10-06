/** Starts background jobs once per server process. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.VITEST) return;
  const { notifyInactive } = await import("./lib/push");
  const { maybePostDaily } = await import("./lib/social");
  setInterval(() => void notifyInactive().catch(() => {}), 60 * 60 * 1000);
  // Checked every 15 minutes; posts once a day after 8 pm IST when social keys are set.
  setInterval(() => void maybePostDaily().catch(() => {}), 15 * 60 * 1000);
}
