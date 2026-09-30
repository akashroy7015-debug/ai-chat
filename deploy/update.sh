#!/usr/bin/env bash
# Keeps the live app on the latest commit of its branch. Runs every 2 minutes (ai-chat-update.timer),
# or by hand with: ai-chat-update
# Builds into .next-build while the site keeps running, then swaps it in and restarts (a few seconds).
# A failed build changes nothing. The result is written to deploy-status.json and shown at /api/health.
set -uo pipefail
APP=/opt/ai-chat/app
STATUS=/var/lib/ai-chat/deploy-status.json
exec 9>/run/ai-chat-update.lock; flock -n 9 || exit 0
cd "$APP" || exit 1
as_app() { sudo -u aichat "$@"; }
status() { # ok commit message
  local msg=${3//\"/\'}
  printf '{"ok":%s,"commit":"%s","at":"%s","message":"%s"}\n' "$1" "$2" "$(date -Is)" "${msg//$'\n'/ }" > "$STATUS"
  chmod 644 "$STATUS"; echo "$(date -Is) $3"
}

BRANCH=$(as_app git rev-parse --abbrev-ref HEAD)
OLD=$(as_app git rev-parse HEAD)
as_app git fetch -q origin "$BRANCH" || { status false "${OLD:0:7}" "git fetch failed"; exit 0; }
NEW=$(as_app git rev-parse "origin/$BRANCH")
[ "$OLD" = "$NEW" ] && [ "${1:-}" != "--force" ] && exit 0

as_app git reset -q --hard "$NEW"
if [ ! -d node_modules ] || ! as_app git diff --quiet "$OLD" "$NEW" -- package-lock.json; then
  if ! as_app npm ci --no-audit --no-fund > /var/log/ai-chat-build.log 2>&1; then
    as_app git reset -q --hard "$OLD"
    status false "${NEW:0:7}" "npm ci failed: $(tail -3 /var/log/ai-chat-build.log)"; exit 0
  fi
fi
rm -rf .next-build
if as_app env NEXT_DIST_DIR=.next-build npm run build > /var/log/ai-chat-build.log 2>&1; then
  rm -rf .next-old; [ -d .next ] && mv .next .next-old
  mv .next-build .next && systemctl restart ai-chat && rm -rf .next-old
  status true "${NEW:0:7}" "updated"
else
  as_app git reset -q --hard "$OLD"
  status false "${NEW:0:7}" "build failed: $(tail -5 /var/log/ai-chat-build.log)"
fi
