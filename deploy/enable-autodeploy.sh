#!/usr/bin/env bash
# One-time: pull latest code and turn on automatic deploys every 5 minutes.
set -euo pipefail
cd /opt/ai-chat/app && sudo -u aichat git pull -q --ff-only
install -m 755 /opt/ai-chat/app/deploy/autodeploy.sh /usr/local/bin/ai-chat-autodeploy
cat > /etc/systemd/system/ai-chat-autodeploy.service <<'UNIT'
[Unit]
Description=ai-chat auto deploy
[Service]
Type=oneshot
ExecStart=/usr/local/bin/ai-chat-autodeploy
StandardOutput=append:/var/log/ai-chat-deploy.log
StandardError=append:/var/log/ai-chat-deploy.log
UNIT
cat > /etc/systemd/system/ai-chat-autodeploy.timer <<'UNIT'
[Unit]
Description=Check for ai-chat updates every 5 minutes
[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now ai-chat-autodeploy.timer
# Build and restart right now so this update is live immediately.
cd /opt/ai-chat/app && sudo -u aichat npm ci --no-audit --no-fund && sudo -u aichat npm run build && systemctl restart ai-chat
echo "Auto-deploy is ON. Log: /var/log/ai-chat-deploy.log"
