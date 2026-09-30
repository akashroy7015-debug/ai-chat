import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

/** Public health check: running commit plus the last update result, so deploys can be checked remotely. */
export async function GET() {
  let lastUpdate: unknown = null;
  try {
    const dir = path.dirname(process.env.DB_PATH ?? path.join(process.cwd(), "data", "app.db"));
    lastUpdate = JSON.parse(fs.readFileSync(path.join(dir, "deploy-status.json"), "utf8"));
  } catch {}
  return NextResponse.json({ ok: true, commit: process.env.BUILD_COMMIT ?? "unknown", lastUpdate });
}
