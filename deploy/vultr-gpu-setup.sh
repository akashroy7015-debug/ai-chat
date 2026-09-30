#!/usr/bin/env bash
# Vultr Cloud GPU startup script: installs Stable Diffusion WebUI Forge with its API on port 7860,
# reachable ONLY from your app server. Rent the GPU, generate pictures, then destroy the GPU server.
#
# EDIT BEFORE USING -----------------------------------------------------------
APP_SERVER_IP="45.77.43.106"   # your app server; only it may call the GPU
# SDXL base 1.0 (CreativeML OpenRAIL++-M licence permits commercial use). Swap for another photoreal
# SDXL checkpoint only if its licence allows commercial use.
MODEL_URL="https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"
# -----------------------------------------------------------------------------
set -euo pipefail
exec > >(tee -a /var/log/sd-setup.log) 2>&1
export DEBIAN_FRONTEND=noninteractive
echo "== SD setup started $(date)"

if ! command -v nvidia-smi >/dev/null || ! nvidia-smi >/dev/null 2>&1; then
  echo "!! No working NVIDIA driver. Pick a Vultr GPU image that includes NVIDIA drivers, or run: ubuntu-drivers install && reboot"
  exit 1
fi

apt-get update -y
apt-get install -y git wget python3 python3-venv python3-pip libgl1 libglib2.0-0 google-perftools ufw

id -u sd >/dev/null 2>&1 || useradd --create-home --shell /bin/bash sd
sudo -u sd bash -c '
  cd ~ && [ -d forge ] || git clone --depth 1 https://github.com/lllyasviel/stable-diffusion-webui-forge.git forge
'
sudo -u sd mkdir -p /home/sd/forge/models/Stable-diffusion
sudo -u sd wget -q -c -O /home/sd/forge/models/Stable-diffusion/model.safetensors "$MODEL_URL"

cat > /etc/systemd/system/sd.service <<UNIT
[Unit]
Description=Stable Diffusion Forge API
After=network.target
[Service]
User=sd
WorkingDirectory=/home/sd/forge
ExecStart=/home/sd/forge/webui.sh --api --listen --port 7860 --skip-version-check
Restart=always
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now sd

ufw allow OpenSSH
ufw allow from "$APP_SERVER_IP" to any port 7860 proto tcp
ufw --force enable

echo "== SD setup finished $(date). First start downloads extra files (10-15 min). Check: curl -s localhost:7860/sdapi/v1/sd-models"
