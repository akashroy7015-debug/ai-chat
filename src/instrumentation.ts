/** Starts background jobs once per server process. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.VITEST) return;
  const { notifyInactive } = await import("./lib/push");
  setInterval(() => void notifyInactive().catch(() => {}), 60 * 60 * 1000);
}
