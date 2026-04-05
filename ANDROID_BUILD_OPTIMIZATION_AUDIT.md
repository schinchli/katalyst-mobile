# Android Build & Expo Go Optimization Audit
> Updated: 2026-03-23

## Changes Applied
- Removed unused `@expo/ngrok` dependency from `mobile/package.json`.
- Removed `expo-tracking-transparency` because the current mobile ads flow is stubbed and no real tracking-backed SDK is active in this build.
- Added `start:go` script for faster Expo Go startup over LAN:
  - `npm run start:go`
- Added `start:dev-client` script for faster local native iteration:
  - `npm run start:dev-client`
- Reduced app startup blocking in `mobile/app/_layout.tsx`:
  - Splash screen now waits for auth bootstrap only
  - Remote config/content sync runs in the background
  - Removed tracking-permission startup path entirely for the current build

## Unwanted / Questionable Packages Reviewed

### Removed
- `@expo/ngrok`
  - Reason: not used by runtime code
  - Impact: smaller install footprint and less dependency churn for local/dev setup
- `expo-tracking-transparency`
  - Reason: no live mobile ads/tracking SDK in this build, only stubs/placeholders
  - Impact: removes one mobile dependency and avoids unnecessary user permission requests

### Kept Intentionally
- `react-dom`
- `react-native-web`
  - Reason: required for Expo Router web support and Expo package expectations
- `nativewind`
- `tailwindcss`
  - Reason: currently used by `app/dev-config.tsx` and Metro/Babel config
- `@react-navigation/native`
  - Reason: imported directly in `app/_layout.tsx` for `ThemeProvider`, `DefaultTheme`, and `DarkTheme`
- `expo-updates`
  - Reason: release/force-update path is configured in `app.json`

## Best-Practice Recommendations for Expo Go
- Prefer `npm run start:go` instead of tunnel-based flows for daily work.
- Prefer `npm run start:dev-client` when debugging native modules or production-like behavior.
- Keep permission prompts out of dev startup unless explicitly testing them.
- Avoid blocking splash on non-critical remote syncs.
- Keep Metro workspace/watchFolders minimal in monorepos.

## Remaining Optimization Opportunities
- If web support is not needed from the mobile workspace, re-evaluate `react-dom` and `react-native-web`.
- If `dev-config.tsx` is retired or rewritten without NativeWind, remove `nativewind` and `tailwindcss`.
- If Android native builds become the primary workflow, use Dev Client rather than Expo Go for faster iteration on native behavior.
- If real AdMob/ads SDK is later added, restore only the exact permissions and tracking prompts required by that SDK.
