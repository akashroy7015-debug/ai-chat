#!/usr/bin/env bash
# Runs every few minutes (systemd timer). If the tracked branch has new commits:
# pull, install, build, restart. If the build fails, roll back to the last working commit.
set -uo pipefail
APP=/opt/ai-chat/app
LOCK=/run/ai-chat-deploy.lock
exec 9>"$LOCK"; flock -n 9 || exit 0

cd "$APP"
as_app() { sudo -u aichat "$@"; }

as_app git fetch -q origin || exit 0
BRANCH=$(as_app git rev-parse --abbrev-ref HEAD)
OLD=$(as_app git rev-parse HEAD)
NEW=$(as_app git rev-parse "origin/$BRANCH")
[ "$OLD" = "$NEW" ] && exit 0

echo "$(date -Is) deploying $OLD -> $NEW"
if as_app git merge -q --ff-only "origin/$BRANCH" && as_app npm ci --no-audit --no-fund && as_app npm run build; then
  systemctl restart ai-chat
  echo "$(date -Is) deployed $NEW"
else
  echo "$(date -Is) build FAILED for $NEW, rolling back to $OLD"
  as_app git reset -q --hard "$OLD"
  as_app npm ci --no-audit --no-fund && as_app npm run build && systemctl restart ai-chat
fi
