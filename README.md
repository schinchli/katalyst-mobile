# Katalyst Mobile App

React Native (Expo Router) mobile app for Katalyst LMS.

## Theme System (iOS + Android + Web target)

The app supports user-selectable theme packs (colors + gradients) with dark mode.

### Where themes are defined

- `stores/themeStore.ts`
  - Source of truth for available theme packs (`ACCENT_PRESETS`).
  - Persists selected `accent` and `darkMode` in AsyncStorage.
- `constants/Colors.ts`
  - Base light/dark tokens (surface, text, borders, semantic colors).
  - Includes gradient tokens: `gradientFrom`, `gradientTo`, `gradientAccent`.
- `hooks/useThemeColor.ts`
  - Combines base tokens + selected preset.
  - Exposes final tokens through `useThemeColor` / `useThemeColors`.

### User-facing theme controls

- `app/(tabs)/profile.tsx`
  - Theme pack picker.
  - Dark mode toggle.
  - Live visual preview through header gradient and UI accents.

### Themed components/pages

- `components/ui/Button.tsx`
  - Primary buttons render gradient backgrounds from active theme.
- Most screens read colors via `useThemeColors()`.

### Adding a new theme pack

1. Add a new key to `AccentPreset` in `stores/themeStore.ts`.
2. Add token values to `ACCENT_PRESETS`:
   - `primary`, `primaryLight`, `primaryText`, `primaryTextDark`
   - `gradientFrom`, `gradientTo`, `gradientAccent`
   - `label`, `emoji`
3. Add it to picker ordering in `app/(tabs)/profile.tsx` (`presetKeys`).
4. Verify contrast in both light/dark mode.

## Commands

- Install deps: `npm install`
- Start dev server: `npm run start`
- iOS: `npm run ios`
- Android: `npm run android`
- Web preview: `npm run web`
- Typecheck: `npm run typecheck`
- Tests: `npm run test`

## Notes

- Current `typecheck` may fail due to pre-existing quiz category typing mismatches in `data/quizzes.ts` (not theme-related).
