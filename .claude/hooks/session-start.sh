#!/usr/bin/env bash
# Runs at the start of every Claude Code session so the tools needed to build, test and manage the site exist.
set -uo pipefail
cd "$(dirname "$0")/../.."
[ -d node_modules ] || npm ci --no-audit --no-fund >/dev/null 2>&1
# ffmpeg (for reading model videos) via a self-contained Python package.
python3 -c "import imageio_ffmpeg" 2>/dev/null || pip install -q imageio-ffmpeg >/dev/null 2>&1
FF=$(python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())" 2>/dev/null)
[ -n "$FF" ] && ln -sf "$FF" /usr/local/bin/ffmpeg 2>/dev/null
echo "Tools ready: node $(node -v), ffmpeg $([ -x /usr/local/bin/ffmpeg ] && echo yes || echo no), playwright $(npm ls -g playwright 2>/dev/null | grep -o 'playwright@[0-9.]*' || echo built-in)"
