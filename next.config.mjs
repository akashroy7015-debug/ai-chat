import { execSync } from "node:child_process";

let commit = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
} catch {}

/** @type {import('next').NextConfig} */
export default { reactStrictMode: true, env: { BUILD_COMMIT: commit } };
