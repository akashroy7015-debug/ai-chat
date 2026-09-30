import { NextResponse } from "next/server";

/** Public health check. Shows which commit is running so deploys can be verified remotely. */
export async function GET() {
  return NextResponse.json({ ok: true, commit: process.env.BUILD_COMMIT ?? "unknown" });
}
