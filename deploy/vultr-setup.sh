#!/usr/bin/env bash
# One-shot server setup for Ubuntu 22.04/24.04 (Vultr "Startup Script", or run as root).
# Installs Node 22, builds the app, runs it as a systemd service behind Caddy (automatic HTTPS).
#
# EDIT THESE BEFORE USING ---------------------------------------------------------------
OPENAI_API_KEY=""          # your OpenAI key, or leave empty to run with test replies
DOMAIN=""                  # e.g. app.yourbrand.com (leave empty to use http://SERVER_IP)
SUPPORT_EMAIL="support@yourdomain.com"
# ---------------------------------------------------------------------------------------
REPO="https://github.com/akashroy7015-debug/ai-chat.git"
BRANCH="claude/replika-marketing-copy-tr8zp6"

set -euo pipefail
exec > >(tee -a /var/log/ai-chat-setup.log) 2>&1
echo "== ai-chat setup started $(date)"
export DEBIAN_FRONTEND=noninteractive

# 1 GB servers need swap to build Next.js.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

apt-get update -y
apt-get install -y curl git build-essential python3 ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https ufw sqlite3 rsync

# Node.js 22
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1)" != "v22" ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# Caddy (reverse proxy with automatic HTTPS)
if ! command -v caddy >/dev/null; then
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y && apt-get install -y caddy
fi

# App user, code and data
id -u aichat >/dev/null 2>&1 || useradd --system --create-home --home-dir /opt/ai-chat --shell /usr/sbin/nologin aichat
mkdir -p /var/lib/ai-chat && chown aichat:aichat /var/lib/ai-chat
if [ ! -d /opt/ai-chat/app/.git ]; then
  sudo -u aichat git clone --branch "$BRANCH" "$REPO" /opt/ai-chat/app
fi

# Config (only written the first time; edit /etc/ai-chat.env later and run: systemctl restart ai-chat)
if [ ! -f /etc/ai-chat.env ]; then
  LLM=mock; [ -n "$OPENAI_API_KEY" ] && LLM=openai
  cat > /etc/ai-chat.env <<ENV
NODE_ENV=production
DB_PATH=/var/lib/ai-chat/app.db
LLM_PROVIDER=$LLM
OPENAI_API_KEY=$OPENAI_API_KEY
OPENAI_MODERATION=$([ -n "$OPENAI_API_KEY" ] && echo true || echo false)
ALLOW_EXPLICIT=false
# TEST MODE: anyone passes age checks and purchases are free. Replace before public launch.
AGE_PROVIDER=mock
PAYMENT_PROVIDER=mock
GRIEVANCE_OFFICER_EMAIL=$SUPPORT_EMAIL
ENV
  chmod 640 /etc/ai-chat.env && chown root:aichat /etc/ai-chat.env
fi

# Build
cd /opt/ai-chat/app
sudo -u aichat npm ci
sudo -u aichat npm run build

# Service
cat > /etc/systemd/system/ai-chat.service <<'UNIT'
[Unit]
Description=ai-chat web app
After=network.target

[Service]
User=aichat
WorkingDirectory=/opt/ai-chat/app
EnvironmentFile=/etc/ai-chat.env
ExecStart=/usr/bin/npm start -- -H 127.0.0.1 -p 3000
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=full
ReadWritePaths=/var/lib/ai-chat /opt/ai-chat

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now ai-chat

# Reverse proxy
SITE="${DOMAIN:-:80}"
cat > /etc/caddy/Caddyfile <<CADDY
$SITE {
  encode gzip
  reverse_proxy 127.0.0.1:3000
}
CADDY
systemctl restart caddy

# Firewall: SSH + web only
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable

# Nightly database backup, keeping 14 days
cat > /etc/cron.daily/ai-chat-backup <<'CRON'
#!/bin/sh
mkdir -p /var/backups/ai-chat
# sqlite3 .backup is safe while the app is running (a plain copy of a live WAL database is not).
[ -f /var/lib/ai-chat/app.db ] && sqlite3 /var/lib/ai-chat/app.db ".backup /var/backups/ai-chat/app-$(date +%F).db"
find /var/backups/ai-chat -name 'app-*.db' -mtime +14 -delete
CRON
chmod +x /etc/cron.daily/ai-chat-backup

cat > /usr/local/bin/ai-chat-update <<'UPD'
#!/bin/sh
# Pull the latest code, rebuild and restart.
set -e
cd /opt/ai-chat/app
sudo -u aichat git pull --ff-only
sudo -u aichat npm ci
sudo -u aichat npm run build
systemctl restart ai-chat
echo "Updated."
UPD
chmod +x /usr/local/bin/ai-chat-update

bash /opt/ai-chat/app/deploy/install-updater.sh || true

echo "== ai-chat setup finished $(date). Open: ${DOMAIN:+https://$DOMAIN}${DOMAIN:-http://$(curl -s -4 ifconfig.me)}"
