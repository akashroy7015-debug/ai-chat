#!/usr/bin/env bash
# One-time: switch the server to the simple updater and update now.
#   curl -fsSL https://raw.githubusercontent.com/akashroy7015-debug/ai-chat/claude/replika-marketing-copy-tr8zp6/deploy/install-updater.sh | bash
set -euo pipefail
BRANCH=claude/replika-marketing-copy-tr8zp6
cd /opt/ai-chat/app
sudo -u aichat git fetch -q origin "$BRANCH"
sudo -u aichat git reset -q --hard "origin/$BRANCH"

# Remove the old updater.
systemctl disable --now ai-chat-autodeploy.timer 2>/dev/null || true
rm -f /etc/systemd/system/ai-chat-autodeploy.* /usr/local/bin/ai-chat-autodeploy
rm -rf /opt/ai-chat/staging

cat > /etc/systemd/system/ai-chat-update.service <<'UNIT'
[Unit]
Description=ai-chat updater
[Service]
Type=oneshot
ExecStart=/bin/bash /opt/ai-chat/app/deploy/update.sh
StandardOutput=append:/var/log/ai-chat-deploy.log
StandardError=append:/var/log/ai-chat-deploy.log
UNIT
cat > /etc/systemd/system/ai-chat-update.timer <<'UNIT'
[Unit]
Description=Check for ai-chat updates every 2 minutes
[Timer]
OnBootSec=1min
OnUnitActiveSec=2min
[Install]
WantedBy=timers.target
UNIT
printf '#!/bin/sh\nexec /bin/bash /opt/ai-chat/app/deploy/update.sh --force\n' > /usr/local/bin/ai-chat-update
chmod 755 /usr/local/bin/ai-chat-update
systemctl daemon-reload
systemctl enable --now ai-chat-update.timer
echo "Building now (3-5 minutes)..."
/usr/local/bin/ai-chat-update
cat /var/lib/ai-chat/deploy-status.json
