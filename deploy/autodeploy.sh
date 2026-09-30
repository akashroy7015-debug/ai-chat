#!/usr/bin/env bash
# Runs every 5 minutes (systemd timer). If the tracked branch has new commits, builds them in a
# separate staging copy while the live site keeps running, then swaps it in (seconds of downtime).
# A failed build changes nothing on the live site.
set -uo pipefail
APP=/opt/ai-chat/app
STAGE=/opt/ai-chat/staging
exec 9>/run/ai-chat-deploy.lock; flock -n 9 || exit 0
as_app() { sudo -u aichat "$@"; }

BRANCH=$(as_app git -C "$APP" rev-parse --abbrev-ref HEAD)
URL=$(as_app git -C "$APP" remote get-url origin)
[ -d "$STAGE/.git" ] || as_app git clone -q --branch "$BRANCH" "$URL" "$STAGE" || exit 0

as_app git -C "$STAGE" fetch -q origin || exit 0
LIVE=$(as_app git -C "$APP" rev-parse HEAD)
NEW=$(as_app git -C "$STAGE" rev-parse "origin/$BRANCH")
[ "$LIVE" = "$NEW" ] && exit 0

echo "$(date -Is) building $NEW (live: $LIVE)"
cd "$STAGE"
if as_app git reset -q --hard "origin/$BRANCH" && as_app npm ci --no-audit --no-fund && as_app npm run build; then
  # Also pick up a newer copy of this script for next time.
  install -m 755 "$STAGE/deploy/autodeploy.sh" /usr/local/bin/ai-chat-autodeploy
  systemctl stop ai-chat
  rsync -a --delete "$STAGE/" "$APP/"
  systemctl start ai-chat
  echo "$(date -Is) live on $NEW"
else
  echo "$(date -Is) build FAILED for $NEW; live site unchanged on $LIVE"
fi
