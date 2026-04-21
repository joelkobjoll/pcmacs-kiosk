#!/usr/bin/env bash
# install-service.sh — Install pcmacs-kiosk systemd service
# Must be run as root (or with sudo)
set -euo pipefail

KIOSK_USER="${KIOSK_USER:-pi}"
KIOSK_DIR="${KIOSK_DIR:-/home/$KIOSK_USER/pcmacs-kiosk}"
SYSTEMD_DIR="/etc/systemd/system"
SERVICE_NAME="pcmacs-kiosk"

# Copy the service file, substituting actual paths
sed \
  -e "s|%KIOSK_USER%|$KIOSK_USER|g" \
  -e "s|%KIOSK_DIR%|$KIOSK_DIR|g" \
  "$KIOSK_DIR/systemd/pcmacs-kiosk.service.template" \
  > "$SYSTEMD_DIR/${SERVICE_NAME}.service"

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"

echo "==> Service '$SERVICE_NAME' installed and enabled."
echo "    Start it now with: systemctl start $SERVICE_NAME"
