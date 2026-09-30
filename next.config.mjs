import { execSync } from "node:child_process";

let commit = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
} catch {}

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // The updater builds into .next-build and swaps it in, so the live site keeps running during builds.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  env: { BUILD_COMMIT: commit },
};
