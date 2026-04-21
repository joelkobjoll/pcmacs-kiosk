#!/usr/bin/env bash
# start.sh — Start the PC Macs Kiosk
# Usage: ./scripts/start.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
API_DIR="$ROOT_DIR/apps/api"
PORT="${PORT:-3000}"

echo "[kiosk] Starting API server..."
node "$API_DIR/dist/main.js" &
API_PID=$!

# Wait for the API to be ready
echo "[kiosk] Waiting for API on port $PORT..."
for i in $(seq 1 20); do
  if curl -sf "http://localhost:$PORT/api/setup/status" > /dev/null 2>&1; then
    echo "[kiosk] API ready."
    break
  fi
  sleep 1
done

echo "[kiosk] Launching Chromium in kiosk mode..."
chromium \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-translate \
  --disable-features=TranslateUI \
  --disable-session-crashed-bubble \
  --check-for-update-interval=31536000 \
  --disable-component-update \
  "http://localhost:$PORT/display"

# If Chromium exits, also stop the API
kill $API_PID 2>/dev/null || true
