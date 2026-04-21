#!/usr/bin/env bash
# setup-pi.sh — One-shot Raspberry Pi provisioning for PC Macs Kiosk
# Run as: sudo bash scripts/setup-pi.sh
set -euo pipefail

KIOSK_USER="${KIOSK_USER:-pi}"
KIOSK_DIR="${KIOSK_DIR:-/home/$KIOSK_USER/pcmacs-kiosk}"

echo "==> Updating system packages..."
apt-get update -y && apt-get upgrade -y

echo "==> Installing Chromium and utilities..."
apt-get install -y chromium-browser curl unclutter xdotool

echo "==> Installing Node.js (LTS)..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "Node: $(node --version)"

echo "==> Installing pnpm..."
npm install -g pnpm
echo "pnpm: $(pnpm --version)"

echo "==> Installing project dependencies..."
cd "$KIOSK_DIR"
pnpm install --frozen-lockfile

echo "==> Building project..."
pnpm build

echo "==> Installing systemd service..."
bash "$KIOSK_DIR/scripts/install-service.sh"

echo ""
echo "==> Setup complete!"
echo "    The kiosk will start automatically on next boot."
echo "    Admin panel: http://$(hostname -I | awk '{print $1}'):3000/admin"
echo ""
echo "    Start now with: systemctl start pcmacs-kiosk"
