#!/usr/bin/env bash
# setup-eas.sh — One-time EAS project registration for Katalyst
# Run this once from the mobile/ directory: bash scripts/setup-eas.sh
set -e

cd "$(dirname "$0")/.."

echo "=== Katalyst EAS Setup ==="
echo ""

# Step 1 — Login
echo "Step 1: Log in to your Expo/EAS account"
echo "(Create a free account at https://expo.dev if you don't have one)"
echo ""
npx eas login

# Step 2 — Init project (registers on expo.dev and writes projectId to app.json)
echo ""
echo "Step 2: Register this project on EAS"
npx eas init --id --force

# Step 3 — Verify projectId was written
PROJECT_ID=$(node -e "const j=require('./app.json'); console.log(j.expo?.extra?.eas?.projectId ?? '')")
if [ -z "$PROJECT_ID" ]; then
  echo ""
  echo "⚠️  projectId was not written to app.json automatically."
  echo "Copy your project ID from https://expo.dev/accounts/<username>/projects/katalyst"
  echo "Then add it to app.json under: expo.extra.eas.projectId"
else
  echo ""
  echo "✅ projectId set: $PROJECT_ID"
fi

# Step 4 — Summary
echo ""
echo "=== Done ==="
echo "Next steps:"
echo "  1. Fill eas.json submit.production.ios fields (appleId, ascAppId, appleTeamId)"
echo "  2. Place google-play-service-account.json in mobile/credentials/"
echo "  3. Run: eas build --platform all --profile production"
