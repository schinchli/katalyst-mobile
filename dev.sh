#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Katalyst — stable LAN dev server
#
# Usage:  ./dev.sh          (start Metro + show QR)
#         ./dev.sh --clear  (wipe Metro cache first)
#
# The QR code is saved to dev-qr.png in this folder.
# It only changes if your Mac's IP changes — pin it once:
#
#   sudo networksetup -setmanual Wi-Fi 192.168.1.6 255.255.255.0 192.168.1.1
#
# ─────────────────────────────────────────────────────────────────────────────

set -e
cd "$(dirname "$0")"

PORT=8081
HOST=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
EXP_URL="exp://${HOST}:${PORT}"
QR_FILE="$(pwd)/dev-qr.png"

echo ""
echo "  Katalyst Dev Server"
echo "  ───────────────────"
echo "  LAN URL : $EXP_URL"
echo "  QR file : $QR_FILE"
echo ""

# Generate QR (requires: npm install -g qrcode  OR  npx qrcode)
if command -v node &>/dev/null; then
  node -e "
    try {
      const QRCode = require('qrcode');
      QRCode.toFile('$QR_FILE', '$EXP_URL', {width:400, margin:2}, (e) => {
        if (!e) { console.log('  QR saved → $QR_FILE'); require('child_process').exec('open $QR_FILE'); }
      });
    } catch(e) { console.log('  (qrcode package not found — skip QR generation)'); }
  " 2>/dev/null || true
fi

# Kill any stale Metro on this port
lsof -ti :$PORT | xargs kill -9 2>/dev/null || true
sleep 1

# Start Metro in LAN mode (no ngrok = no disconnections)
EXTRA_ARGS=""
[[ "$1" == "--clear" ]] && EXTRA_ARGS="--clear"

exec npx expo start --lan --port $PORT $EXTRA_ARGS
