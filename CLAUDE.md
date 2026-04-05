# CLAUDE.md — Project Commandments
## Monorepo: Web + Mobile Application
> **This is the single source of truth for all AI-assisted development on this project. Every rule here is a hard constraint — not a suggestion. Last validated: February 2026 against Expo SDK 54 + React Native 0.81 + React 19.1.**
> ⚠️ **April 28, 2026 deadline:** All App Store submissions must use Xcode 26 + iOS 26 SDK. See §12.4a.

> **Operational note (March 2026):** Quiz premium/free state is no longer hardcoded-only. Admin overrides live in `app_settings.key = quiz_catalog_overrides` and must be respected by both the web dashboard and the mobile app before changing any quiz gating logic.

***

## 🏗️ Project Overview

This is a **monorepo** containing a **web application** and a **mobile application** built with shared packages. The design system is **Vuexy** throughout. The product must be visually stunning, deeply engaging, fully responsive, and monetisation-ready from day one.

**Canonical Stack (February 2026):**

| Layer | Technology | Version |
|---|---|---|
| Monorepo manager | pnpm workspaces + Turborepo | pnpm 9+, Turbo 2+ |
| Web app | Next.js (Vuexy Next.js template) | 15.x |
| Mobile app | Expo | **SDK 54** (stable) |
| React Native | React Native | **0.81** |
| React | React | **19.1** |
| Mobile routing | Expo Router | **v6** |
| Shared UI | packages/ui (Vuexy tokens) | — |
| Shared logic | packages/core | — |
| Shared config | packages/config | — |
| State | Zustand + TanStack Query v5 | — |
| Animations | **Reanimated v4** | — |
| Lists | FlashList | 1.x |
| Validation | Zod v3 | — |
| Auth tokens (mobile) | expo-secure-store | — |
| Video | **expo-video** (NOT expo-av) | — |
| Audio | **expo-audio** (NOT expo-av) | — |
| File system | **expo-file-system** (new object API) | — |
| Background tasks | **expo-background-task** (NOT expo-background-fetch) | — |

***

## ⚙️ Commandment 1 — Monorepo Structure is Sacred

- ALL code lives in one of: `apps/web`, `apps/mobile`, `packages/ui`, `packages/core`, `packages/config`
- `apps/` contains ONLY thin shell apps — no business logic, no raw API calls
- ALL shared logic, types, and utilities belong in `packages/core`
- `packages/ui` is the single source for every UI component — never duplicate a component across apps
- Never create circular dependencies — `apps` import from `packages`, NEVER the reverse
- Run `turbo run build --filter=...` for affected builds only — never build the full repo on every change

**Required folder structure:**
```
/
├── apps/
│   ├── web/                    ← Next.js 15 web app (Vuexy template)
│   └── mobile/                 ← Expo SDK 54 app
├── packages/
│   ├── ui/                     ← Vuexy-based shared components
│   ├── core/                   ← Shared API, auth, state, types, utils
│   └── config/                 ← ESLint, TSConfig, Prettier, Tailwind
├── CLAUDE.md                   ← You are here
├── turbo.json
├── .npmrc                      ← node-linker=hoisted (required for pnpm + RN)
└── pnpm-workspace.yaml
```

**pnpm-workspace.yaml (root):**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Root .npmrc:**
```
node-linker=hoisted
shamefully-hoist=true
```

**Root package.json — pin a single React / RN version across the whole repo:**
```json
{
  "name": "monorepo",
  "private": true,
  "resolutions": {
    "react": "19.1.0",
    "react-native": "0.81.x"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

> ⚠️ From **SDK 55**, `autolinkingModuleResolution` will be auto-enabled in monorepos. For SDK 54, explicitly set it in `app.config.ts`.

***

## 🎨 Commandment 2 — Vuexy Theme is the Only Design Law

- Every single UI element — cards, buttons, modals, tables, forms, badges, navbars — MUST use a Vuexy component or Vuexy design token
- **Never** introduce a third-party UI library (MUI, Ant Design, shadcn) unless it is the underlying base of Vuexy
- Use only Vuexy's colour palette, typography scale, spacing tokens, border-radius variables, and shadow system
- Dark mode and light mode MUST both be supported using Vuexy's built-in theme switching
- Custom components must extend Vuexy base components — never build from scratch if a Vuexy component exists
- All Vuexy customisations must live in `packages/ui` so both web and mobile consume identical design tokens

**Vuexy colour token usage — always tokens, never hardcoded hex:**
```css
/* ✅ Correct */
color: var(--vz-primary);
background: var(--vz-card-bg);

/* ❌ Wrong */
color: #556ee6;
background: #ffffff;
```

***

## 📱 Commandment 3 — Mobile-First, Fully Responsive Everywhere

- Design every screen **mobile-first** — write base styles for mobile, then add breakpoint overrides for tablet and desktop
- All tap targets must be **minimum 44×44px** on mobile
- Use Vuexy's responsive grid — never use fixed pixel widths for layout containers
- Test every screen at: `320px`, `375px`, `768px`, `1024px`, `1280px`, `1440px`
- No horizontal scrolling is permitted on any screen at any breakpoint
- Font sizes must use relative units (`rem`) and scale with system font size preferences
- Images must use responsive srcsets and lazy loading — CLS must be < 0.1
- On mobile, navigation must be a **native bottom tab bar** using Expo Router v6 `NativeTabs` — not a JS-rendered hamburger menu

***

## 💰 Commandment 4 — Monetisation Slots are First-Class Citizens

Every screen layout must account for ad/monetisation placements **at design time**, not as an afterthought.

**Required ad slot components in `packages/ui`:**
```tsx
<AdSlot id="banner-top" size="leaderboard" />        // 728×90 web top
<AdSlot id="banner-bottom" size="mobile-banner" />   // 320×50 mobile sticky bottom
<AdSlot id="interstitial" trigger="route-change" />  // Full-screen between pages
<AdSlot id="native-feed" />                          // Native ads inside content feeds
<AdSlot id="rewarded" reward={{ type: 'unlock' }} /> // Rewarded video (opt-in only)
```

**Ad placement rules:**
- Banner ads: Sticky at the **bottom** of the screen — never at the top where content is consumed
- Interstitial ads: Only at **natural transition points** — never mid-flow
- Rewarded video: Always opt-in with a clear value exchange ("Watch ad to unlock premium content")
- Native ads: Must visually match the Vuexy card style — clearly labelled "Sponsored"
- **Frequency cap**: Max 1 interstitial per 3 minutes per user session
- **Zero accidental clicks**: Minimum 48px spacing between ad units and interactive buttons
- Ad slots must render a Vuexy skeleton placeholder when no ad is loaded — never a blank white space
- GDPR/CCPA consent banner must appear before any ad SDK is initialised

**Monetisation model hooks (implement all):**

| Model | Implementation |
|---|---|
| In-app advertising | `<AdSlot>` with AdMob / Google Ad Manager |
| Subscriptions | `packages/core/subscription` with RevenueCat |
| Freemium gates | `<PremiumGate>` wrapper in `packages/ui` |
| Rewarded content | `<RewardedAdTrigger>` with callback |
| Affiliate/Native | `<NativeAdCard>` in feed lists |

***

## 🔥 Commandment 5 — Engagement & Retention are Product Features

**Mandatory engagement patterns:**
- **Progressive onboarding**: Reveal features gradually — never dump everything on screen 1
- **Gamification**: Use Vuexy badges, progress bars, and streak counters to reward repeat usage
- **Personalisation**: Surface a "For You" section on the home screen based on user behaviour
- **Pull-to-refresh**: All feed/list screens must support pull-to-refresh with a Reanimated animation
- **Contextual in-app messages**: Non-blocking toast/snackbar tips to guide users to undiscovered features
- **Streak / achievement system**: Track activity streaks and celebrate milestones with Vuexy modal animations
- **Smart notifications**: Push notifications must be contextual and timely — never spam
- **Skeleton screens**: Every async data fetch must show a Vuexy skeleton loader — never a blank screen

**Retention-first rules:**
- The primary CTA must be **immediately visible** above the fold on every screen
- User progress and past activity must be shown on the home screen dashboard
- "Continue where you left off" state must be persisted via `packages/core/session`

***

## 🧩 Commandment 6 — Components Must Be Atomic & Composable

- Every UI component is built in `packages/ui` following atomic design: **Atoms → Molecules → Organisms → Templates**
- Each component: `ComponentName/index.tsx`, `ComponentName/ComponentName.stories.tsx`, `ComponentName/ComponentName.test.tsx`
- Components accept `className` / `style` overrides but must never break their Vuexy base styling
- All components must support `loading`, `error`, and `empty` states
- **Zero prop drilling** beyond 2 levels — use context or Zustand for deeply shared state
- Every exported component must have TypeScript prop types with JSDoc descriptions

***

## ⚡ Commandment 7 — Performance is Non-Negotiable

**Targets: Lighthouse ≥ 90, FCP < 1.5s on 4G mobile.**

- Use **dynamic imports** for every page and heavy component — no monolithic bundles
- Images: `next/image` (web) or `expo-image` (mobile) — never raw `<img>` or `<Image>` from RN core
- All lists with > 20 items MUST use **FlashList** — never `FlatList` or `ScrollView` for data lists
- Pre-fetch data for the next likely screen on idle using `prefetch` hooks in `packages/core`
- **Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- API responses must be cached with **TanStack Query v5** — no uncached fetch calls in components
- Initial web JS bundle budget: **< 200KB gzipped** — alert CI if exceeded

***

## 🔒 Commandment 8 — Type Safety & Code Quality are Absolute

- **TypeScript strict mode** is ON everywhere — `"strict": true` in all `tsconfig.json` files
- `any` type is **forbidden** — use `unknown` and narrow with type guards
- ESLint must pass with **zero warnings** before any commit
- Prettier auto-formats on save — config in `packages/config/prettier`
- **Husky pre-commit hooks** must run: `lint`, `typecheck`, and `test:affected`
- All async functions must handle errors — no unhandled promise rejections
- `console.log` is forbidden in production — use `packages/core/logger`
- Every function > 20 lines must be refactored or commented

***

## ♿ Commandment 9 — Accessibility is Not Optional

- All interactive elements must have `aria-label` or visible text labels
- Colour contrast must meet **WCAG 2.1 AA** (4.5:1 for text, 3:1 for UI elements)
- Full keyboard navigation on web — logical tab order, visible focus rings using Vuexy styles
- Screen reader support: test with VoiceOver (iOS/Mac) and TalkBack (Android)
- No information conveyed by colour alone — always pair with an icon or text
- All images must have meaningful `alt` text — decorative images get `alt=""`
- Support system-level **large text** scaling without layout breakage

***

## 🚀 Commandment 10 — CI/CD Must Be Fast & Safe

- CI runs only **affected packages**: `turbo run --filter=[affected]`
- Pipeline order: `install → lint:affected → typecheck → test:unit → test:e2e → build:affected → deploy`
- Remote caching enabled via Turborepo Cloud or Vercel Remote Cache
- **No direct pushes to `main`** — all changes via PRs with at least 1 reviewer
- Staging auto-deploys on merge to `develop`
- Production requires manual approval after all checks pass
- Feature flags (`packages/core/flags`) must gate all unfinished features — never comment out code

***

## 🛡️ Commandment 11 — Security is Baked In

- **Zero secrets in code** — all env vars in `.env.local`, injected via CI secrets
- API keys must be server-side only — never in the client bundle
- All user inputs validated with **Zod** schemas in `packages/core/validation`
- Auth tokens: `expo-secure-store` (mobile), `httpOnly` cookies (web) — never `AsyncStorage` or `localStorage`
- GDPR/CCPA consent banner before any ad SDK initialises
- Rate limiting and CORS configured on all API routes
- Use `expo-app-integrity` for DeviceCheck (iOS) and Play Integrity (Android) API attestation
- Certificate pinning implemented for all production API calls

***

## 📱 Commandment 12 — Expo SDK 54 Best Practices

> All rules here apply exclusively to `apps/mobile`. Validated against SDK 54 (React Native 0.81, React 19.1) — latest stable as of February 2026.

### 12.1 — SDK & Architecture

- Always use **Expo SDK 54** — stable with React Native 0.81 + React 19.1
- **SDK 54 is the final release with Legacy Architecture support** — New Architecture is now mandatory; never disable it
- **React Compiler** is ON by default in SDK 54 — never disable it
- Use `app.config.ts` (TypeScript) — not `app.json`

```ts
// apps/mobile/app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.APP_NAME ?? 'MyApp',
  slug: 'my-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yourcompany.myapp',
    buildNumber: process.env.BUILD_NUMBER ?? '1',
    infoPlist: {
      NSCameraUsageDescription: 'Used for profile photos',
      NSPhotoLibraryUsageDescription: 'Used to upload images',
    },
  },
  android: {
    package: 'com.yourcompany.myapp',
    versionCode: Number(process.env.BUILD_NUMBER ?? 1),
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    ['expo-notifications', { color: '#556ee6' }],
    ['expo-image-picker', { photosPermission: 'Used to upload images' }],
    'expo-app-integrity',
  ],
  experiments: {
    typedRoutes: true,
    autolinkingModuleResolution: true,
  },
  updates: {
    url: 'https://u.expo.dev/YOUR-PROJECT-ID',
    fallbackToCacheTimeout: 0,
    checkAutomatically: 'ON_LOAD',
    requestHeaders: {
      'expo-channel-name': process.env.EAS_UPDATE_CHANNEL ?? 'production',
    },
  },
  extra: {
    eas: { projectId: 'YOUR-EAS-PROJECT-ID' },
    apiUrl: process.env.API_URL,
  },
  runtimeVersion: { policy: 'sdkVersion' },
});
```

### 12.2 — Deprecated Packages — NEVER USE THESE

| ❌ Deprecated | ✅ Replacement | Notes |
|---|---|---|
| `expo-av` | `expo-video` + `expo-audio` | Fully removed in SDK 55 |
| `expo-background-fetch` | `expo-background-task` | New unified task API |
| `expo-file-system` (old string API) | `expo-file-system` (new object API) | Legacy: `expo-file-system/legacy` |
| `react-native` `Animated` | `react-native-reanimated` v4 | Mandatory for all animations |
| `FlatList` from react-native | `FlashList` from @shopify/flash-list | Mandatory for performance |

### 12.3 — Expo Router v6 (File-Based Routing)

- **Expo Router v6** exclusively — no manual React Navigation
- All screens in `apps/mobile/app/` — file path is the route
- Typed routes ON — no raw string routes ever
- `NativeTabs` for bottom navigation (true native iOS/Android tabs)
- `+not-found.tsx` is mandatory

**Recommended route structure:**
```
apps/mobile/app/
├── _layout.tsx
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
├── (app)/
│   ├── _layout.tsx          ← NativeTabs layout
│   ├── index.tsx
│   ├── explore.tsx
│   ├── notifications.tsx
│   └── profile/
│       ├── index.tsx
│       └── [id].tsx
└── +not-found.tsx
```

**NativeTabs layout:**
```tsx
// apps/mobile/app/(app)/_layout.tsx
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Icon sf="safari.fill" md="explore" />
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notifications">
        <NativeTabs.Trigger.Badge>3</NativeTabs.Trigger.Badge>
        <NativeTabs.Trigger.Icon sf="bell.fill" md="notifications" />
        <NativeTabs.Trigger.Label>Notifications</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

### 12.4 — EAS Build Configuration

```json
// apps/mobile/eas.json
{
  "cli": {
    "version": ">=12.0.0",
    "requireCommit": true
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_ENV": "development",
        "API_URL": "https://dev.api.yourapp.com",
        "EAS_UPDATE_CHANNEL": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": {
        "APP_ENV": "preview",
        "API_URL": "https://staging.api.yourapp.com",
        "EAS_UPDATE_CHANNEL": "preview"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "APP_ENV": "production",
        "API_URL": "https://api.yourapp.com",
        "EAS_UPDATE_CHANNEL": "production"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "YOUR_APPLE_ID",
        "ascAppId": "YOUR_ASC_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

> **iOS Build Speed**: SDK 54 ships React Native as precompiled XCFrameworks — dramatically faster clean builds. Never add steps that recompile RN core.

### 12.4a — 🚨 Apple Xcode 26 Deadline (April 28, 2026)

> **Hard deadline: from April 28, 2026, Apple requires ALL App Store submissions to be built with Xcode 26 and the iOS 26 SDK.** Submissions built with older Xcode versions will be rejected.

**What this means for EAS builds:**
- All production EAS builds must use an Xcode 26 image **before April 28, 2026**
- Pin the Xcode version in `eas.json` under each build profile:
```json
"production": {
  "autoIncrement": true,
  "ios": {
    "image": "macos-15-xcode-26"
  },
  ...
}
```
- EAS managed workers will default to Xcode 26 once it is the minimum — but **do not wait** for that; set it explicitly now
- Run a preview build with Xcode 26 immediately to catch any SDK / API compatibility issues before the deadline

**Checklist before April 28, 2026:**
- [ ] `eas.json` production profile pins `image: "macos-15-xcode-26"` (or latest Xcode 26 EAS image)
- [ ] Preview build passes on Xcode 26
- [ ] No deprecated iOS APIs flagged by Xcode 26 build warnings
- [ ] App tested on iOS 26 simulator and a physical device
- [ ] All third-party native modules verified compatible with iOS 26 SDK
- [ ] Submitted at least one TestFlight build via Xcode 26 before the deadline

### 12.5 — EAS Update (OTA)

- All JS/asset hotfixes via EAS Update — never a full store submission for fixes
- Channels must match build profiles: `development`, `preview`, `production`
- `runtimeVersion` policy: `sdkVersion`
- Always stage in `preview` before promoting to `production`

```bash
# Ship OTA update
eas update --branch production --message "Fix: payment crash on checkout"

# Emergency rollback
eas update:rollback --branch production
```

### 12.6 — Performance (Mobile-Specific)

- **FlashList** for ALL lists — never `FlatList`
- **Reanimated v4** for ALL animations — never `Animated` core
- **react-native-gesture-handler** for ALL gestures — never `Touchable*`
- **expo-image** for ALL images — supports disk/memory caching + blurhash placeholders
- **Hermes** engine stays enabled — never disable
- Preload fonts + assets before hiding splash screen

```tsx
// apps/mobile/app/_layout.tsx
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Slot } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;
  return <Slot />;
}
```

### 12.7 — Media: Video & Audio

```tsx
// ✅ Correct — SDK 54+
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAudioPlayer } from 'expo-audio';

// ❌ Banned — removed in SDK 55
import { Video, Audio } from 'expo-av';
```

### 12.8 — File System (New Object API)

```tsx
// ✅ Correct — new object API
import { File, Directory } from 'expo-file-system';

const file = new File(FileSystem.documentDirectory, 'user-data.json');
await file.write(JSON.stringify(data));

// ❌ Banned — legacy string API
import * as FileSystem from 'expo-file-system/legacy';
```

### 12.9 — Push Notifications & Deep Linking

- `expo-notifications` for all push notifications
- Deep links via Expo Router's built-in URL scheme — never manually parse URLs
- Defer notification navigation until app is fully loaded AND auth state is resolved
- Set `ACTIVITY_PREVENT_RESTART` on Android for foreground notification taps
- Test Universal Links (iOS) and App Links (Android) on physical devices

### 12.10 — Security & Storage

- **Never** store secrets, tokens, or PII in `AsyncStorage` — `expo-secure-store` only
- All HTTPS — no plaintext HTTP anywhere
- API keys via EAS build env vars only — never in `app.config.ts` directly
- `expo-crypto` for hashing/random — never `Math.random()` for security
- `expo-app-integrity` for DeviceCheck / Play Integrity attestation
- Certificate pinning for all production API calls

### 12.11 — Monorepo + Expo SDK 54 Integration

- `experiments.autolinkingModuleResolution: true` is mandatory in `app.config.ts`
- One version of `react` and `react-native` only — enforced via root `resolutions`
- Shared packages referenced as `"workspace:*"` in `apps/mobile/package.json`
- After every SDK upgrade: `npx expo-doctor` must pass with zero warnings before committing

### 12.12 — Developer Experience

- **Expo Dev Client** required — never use Expo Go for team development
- **Expo Orbit** for fast simulator/device installs of EAS builds
- **Maestro** or **Detox** for E2E tests — all critical flows must be automated
- **Sentry** (`@sentry/react-native`) for crash logging — sourcemaps uploaded via EAS build hooks

***

## 🚢 Commandment 13 — Full Store Deployment

### 13.1 — Pre-requisites

- **Apple Developer Program**: $99/yr — enrol at developer.apple.com before any iOS submission
- **Google Play Developer account**: $25 one-time — register at play.google.com/console
- **App Store Connect app record** must exist (bundle ID registered, app created) **before** running `eas submit` for the first time — EAS cannot create the record for you
- **First Play Store submission must be manual**: upload the `.aab` file directly in Play Console → create the app → complete store listing → submit to Internal Testing. All subsequent submissions can use `eas submit`
- EAS project ID must be set in `app.config.ts` under `extra.eas.projectId` and the user must be logged in via `eas login`

### 13.2 — Signing Credentials

- **Let EAS auto-manage** iOS certificates and provisioning profiles — never manually create or import them unless forced
- **Android keystore**: EAS generates and stores it. **Back up immediately** to a secure vault (1Password, AWS Secrets Manager). Losing the keystore means you can **never update your app on the Play Store** — you would need to publish as a brand-new app
- iOS certificates are auto-renewed by EAS before expiry — no manual intervention needed
- Never commit `*.p8`, `*.p12`, `*.jks`, `*.keystore`, or `google-play-service-account.json` to git
- Service account JSON for Play Store must have **Release Manager** role minimum in Play Console IAM

### 13.3 — Android 16KB Page Size ⚠️

> **Critical: Google Play requires 16KB memory page size compliance for ALL new app submissions since November 1, 2025. Non-compliant apps are rejected.**

- **SDK 54 + RN 0.81 is compliant** out of the box — do not downgrade
- Every third-party native library (`.so` files) must also be compiled with 16KB page alignment — verify before adding any new native dependency
- Check compliance: `objdump -p <library>.so | grep LOAD` — all `LOAD` segment alignments must be `0x4000` (16384) or greater
- React Native Google Mobile Ads, Reanimated v4, and Gesture Handler are all 16KB-compliant as of their current versions
- If a library is non-compliant, open an issue with the maintainer and use an alternative until fixed — **do not ship non-compliant binaries**

### 13.4 — Build Commands

```bash
# iOS — simulator (development only, never for store)
eas build --platform ios --profile development

# iOS — production App Store build (uses Xcode 26, mandatory from April 28 2026)
eas build --platform ios --profile production

# Android — internal preview APK (sideload/QR, NOT for Play Store)
eas build --platform android --profile preview

# Android — production AAB for Play Store (ALWAYS .aab, never .apk for store)
eas build --platform android --profile production

# Both platforms simultaneously
eas build --platform all --profile production
```

**AAB vs APK rules — non-negotiable:**
- `.aab` (Android App Bundle) → Play Store submissions — smaller download, required by Google since 2021
- `.apk` → Internal distribution / QR sideloading / testing ONLY — never submit to Play Store
- In `eas.json`: production Android must have `"buildType": "app-bundle"`, preview may use `"buildType": "apk"`

### 13.5 — Submission Commands & Track Strategy

```bash
# Submit iOS build to App Store Connect (TestFlight)
eas submit --platform ios --profile production

# Submit Android build to Play Store
eas submit --platform android --profile production
```

**iOS release ladder:**
1. **TestFlight Internal** (up to 100 testers, immediate) → internal team QA
2. **TestFlight External** (up to 10,000 testers, requires Apple review ~24h) → beta users
3. **App Store Submission** → phased rollout: 1% → 5% → 10% → 50% → 100% over 7 days

**Android release ladder:**
1. **Internal Testing** (up to 100 testers, immediate) → team QA
2. **Closed Testing / Alpha** (invite-only group) → beta users
3. **Open Testing / Beta** (public opt-in) → broader validation
4. **Production** → staged rollout: 10% → 20% → 50% → 100% (pause at any stage if crash rate rises)

**Never skip the ladder** — always validate in Internal before promoting to Production.

### 13.6 — Apple Review Checklist

**8 most common rejection reasons:**
1. **Broken functionality** — every feature must work end-to-end; no placeholder screens or "coming soon" buttons
2. **Login required with no demo account** — provide test credentials in App Review notes if auth is required
3. **Privacy policy URL missing** — must be set in App Store Connect AND linked in-app; required for any data collection
4. **Permissions without justification** — every `NSXxxUsageDescription` must explain why the permission is needed
5. **Misleading metadata** — screenshots must match the actual app UI; no stock photos or competitor references
6. **Ads violating guidelines** — no pop-up ads before app load, no ads that mimic system dialogs
7. **In-app purchases not using IAP** — all digital goods must go through Apple IAP (no Stripe/PayPal for digital content)
8. **App crashes during review** — run a production build on a physical device before submitting; never submit a build that hasn't been manually tested

**Required App Store Connect metadata:**
- App name, subtitle (30 chars max), description, keywords (100 chars max)
- Support URL, privacy policy URL, marketing URL (optional)
- Screenshots: 6.9" iPhone (required), 12.9" iPad (if iPad supported)
- App preview video (optional but strongly recommended)
- Age rating questionnaire completed
- Export compliance (encryption) answered

### 13.7 — Google Play Checklist

**6 most common rejection reasons:**
1. **Target API level too low** — must target API 35 (Android 15) for new apps from 2025
2. **Missing privacy policy** — required if app collects any personal data; link in Play Console
3. **Deceptive behaviour** — app must do what the store listing says; no hidden functionality
4. **Permissions not declared in Data Safety** — every permission used must be declared in the Data Safety section
5. **16KB page size non-compliance** — see §13.3; all `.so` libraries must be compliant since November 2025
6. **App crashes / ANRs on review device** — Google uses automated testing; ensure app works on low-end Android devices

**Required Play Console metadata:**
- Short description (80 chars), full description (4000 chars)
- Feature graphic (1024×500px), icon (512×512px)
- Screenshots: phone (minimum 2), tablet (recommended)
- Content rating questionnaire completed
- Data Safety section fully filled out
- Target audience and content settings

### 13.8 — Version Management

- Use **semantic versioning**: `MAJOR.MINOR.PATCH` (e.g. `1.2.3`)
- `version` in `app.config.ts` → displayed to users in store listings
- iOS `buildNumber`: monotonically increasing integer string (`"1"`, `"2"`, …) — `autoIncrement: true` in EAS handles this
- Android `versionCode`: monotonically increasing integer — **must never decrease** — `autoIncrement: true` handles this
- Tag every production release in git: `git tag v1.2.3 && git push --tags`
- Never reuse a `buildNumber` / `versionCode` — Apple and Google both reject duplicate build numbers

```ts
// app.config.ts — version sourced from package.json, build numbers from EAS
version: require('./package.json').version,
ios: { buildNumber: process.env.BUILD_NUMBER ?? '1' },
android: { versionCode: Number(process.env.BUILD_NUMBER ?? 1) },
```

### 13.9 — Post-Release Monitoring

- **Sentry crash-free rate threshold**: if crash-free sessions drop below **98%** (>2% crash rate), immediately ship an OTA fix via `eas update`; if OTA cannot fix it, pause the rollout
- **Android staged rollout**: start at 10%, monitor for 24h, expand to 50%, monitor 24h, then 100%
- **Pause criteria**: crash rate >2%, ANR rate >0.47%, 1-star review spike, Sentry error volume spike >3× baseline
- Monitor in: Sentry dashboard, Play Console Android Vitals, App Store Connect Analytics, Firebase Crashlytics (optional secondary)
- Set up Sentry alerts: `error.rate > 0.02` AND `p95 latency > 3000ms` → PagerDuty / Slack
- Keep previous production build available for rollback — do not delete old EAS builds

```bash
# OTA fix (no store review needed, JS-only changes)
eas update --branch production --message "Fix: crash on quiz completion"

# Emergency rollback to previous OTA
eas update:rollback --branch production

# Pause Android rollout in Play Console (do this manually via Play Console UI)
```

### 13.10 — Release Automation (EAS Workflows)

```yaml
# .eas/workflows/deploy.yml
name: Deploy
on:
  push:
    branches:
      - main         # → production build + submit
      - develop      # → preview build
      - 'release/*'  # → production build (no auto-submit)

jobs:
  build-and-deploy:
    runs-on: eas-build
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm ci
      - name: Lint + typecheck
        run: npx turbo run lint typecheck --filter=mobile
      - name: EAS Build
        uses: expo/eas-build-action@v1
        with:
          profile: ${{ github.ref == 'refs/heads/main' && 'production' || 'preview' }}
          platform: all
      - name: EAS Submit (main only)
        if: github.ref == 'refs/heads/main'
        uses: expo/eas-submit-action@v1
        with:
          profile: production
          platform: all
```

**Branch → Environment mapping:**

| Branch | EAS Build Profile | EAS Update Channel | Auto-Submit |
|---|---|---|---|
| `feature/*` | development | development | No |
| `develop` | preview | preview | No |
| `release/*` | production | — | No (manual) |
| `main` | production | production | Yes |

***

## 📋 Commandment 14 — Claude Code Operational Rules

When generating or modifying any code in this project:

1. **Read this entire CLAUDE.md first** before writing a single line of code
2. **Never hallucinate package names** — only use packages in `package.json` or explicitly listed here
3. **Always place files in the correct package** — ask before creating a new top-level file
4. **Never modify `packages/config`** without explicit instruction — it affects the entire repo
5. **No `any` type ever** — every parameter and return value must be strictly typed
6. **Always generate tests** alongside new components and functions — no untested code ships
7. **Never duplicate code** across packages — extract to `packages/core` or `packages/ui` immediately
8. **Extend Vuexy** — never rebuild a component that already exists in the Vuexy system
9. **Ads only via `<AdSlot>`** — never inline third-party ad SDK code in screen components
10. **Never use deprecated packages** — check Commandment 12.2 before every install
11. **Never disable New Architecture** — if a library doesn't support it, find an alternative
12. **Verify SDK 54 compatibility** before adding any Expo-related package
13. **When unsure**: write `// TODO(claude): [reason]` — never guess and silently proceed
14. **Mentally run `turbo run typecheck lint`** before outputting any code — fix failures first
15. **Keep CLAUDE.md updated** — append new conventions to the relevant commandment immediately

***

## 📐 Quick Reference: Ad Slot Sizing

| Slot | Web Size | Mobile Size | Placement | Max Frequency |
|---|---|---|---|---|
| `banner-top` | 728×90 | — | Below navbar | Always visible |
| `banner-bottom` | 728×90 | 320×50 | Sticky bottom | Always visible |
| `interstitial` | Full screen | Full screen | Route transitions | 1 per 3 min |
| `native-feed` | Matches card | Matches card | Every 5th feed item | As content flows |
| `rewarded` | Modal | Modal | Locked content gate | User-initiated only |
| `mrec` | 300×250 | 300×250 | Sidebar / content break | 1 per scroll page |

***

## 🎯 Per-Screen Engagement Checklist

Every new screen must pass ALL of these before shipping:

- [ ] Primary CTA visible above the fold
- [ ] Personalised / contextual content shown for this user
- [ ] Vuexy skeleton loader on all async content
- [ ] Visible progress indicator (streak, level, or completion %)
- [ ] Ad slots placed at natural breaks — never mid-flow
- [ ] Empty state has a clear call-to-action
- [ ] Pull-to-refresh works (if feed or list screen)
- [ ] Tested at 320px, 375px, 768px, and 1280px widths
- [ ] All interactive elements ≥ 44×44px
- [ ] WCAG AA colour contrast passes

***

## 📱 Per-Feature Expo Mobile Checklist

Every new Expo feature must pass ALL of these before shipping:

- [ ] Expo Router v6 file-based routing used — no manual navigation config
- [ ] NativeTabs used for bottom tab navigation
- [ ] FlashList used for all lists — no FlatList
- [ ] Reanimated v4 used for all animations — no Animated core
- [ ] react-native-gesture-handler used for all gestures
- [ ] Sensitive values in expo-secure-store — not AsyncStorage
- [ ] Typed routes used — no raw string paths in router.push()
- [ ] No deprecated packages (expo-av, expo-background-fetch, legacy file-system API)
- [ ] New Architecture enabled — not disabled anywhere
- [ ] Loading, error, and empty states all handled
- [ ] OTA update channel set correctly for this environment
- [ ] Push notification deep links deferred until auth is resolved
- [ ] Tested on physical iOS AND Android devices
- [ ] `npx expo-doctor` passes with zero warnings
- [ ] **EAS production build uses Xcode 26 image** (mandatory from April 28, 2026 — see §12.4a)

***

## 🚢 Pre-Store Submission Checklist

> This gate must be passed **before every production build trigger**. Both iOS and Android columns must be fully checked before `eas build --profile production` is run.

### Universal (both platforms)

- [ ] `npx expo-doctor` — zero warnings
- [ ] `turbo run typecheck lint` — zero errors, zero warnings
- [ ] All unit and E2E tests passing
- [ ] Version bumped in `package.json` + `app.config.ts` (semver)
- [ ] Git tag created: `git tag v<version>`
- [ ] CHANGELOG updated with all changes since last release
- [ ] Privacy policy URL live and accessible
- [ ] No `console.log` in production code — all replaced with `packages/core/logger`
- [ ] All feature flags for unfinished features are OFF in production config
- [ ] Sentry DSN configured and crash reporting verified in preview build
- [ ] EAS Update channel set to `production`
- [ ] `eas.json` production profile reviewed — correct env vars, `autoIncrement: true`

### iOS-specific

- [ ] `eas.json` production `ios.image` set to `"macos-15-xcode-26"` (**April 28, 2026 deadline**)
- [ ] `ios.buildConfiguration` is `"Release"`
- [ ] Bundle identifier matches App Store Connect record exactly
- [ ] All `NSXxxUsageDescription` strings are human-readable and accurate
- [ ] App tested on physical iPhone (not just simulator) on latest iOS
- [ ] App tested on oldest supported iOS version
- [ ] Screenshots prepared: 6.9" iPhone (required) + 12.9" iPad (if tablet supported)
- [ ] App Store Connect: metadata, keywords, support URL, privacy URL all filled in
- [ ] Export compliance answered in App Store Connect
- [ ] TestFlight internal build tested by ≥ 2 people before External / Production submission
- [ ] `appleId`, `ascAppId`, `appleTeamId` filled in `eas.json` submit config (not TODO)

### Android-specific

- [ ] `eas.json` production `android.buildType` is `"app-bundle"` (NOT `"apk"`)
- [ ] All `.so` libraries verified 16KB page-size compliant (see §13.3)
- [ ] Target SDK = 35 (Android 15) — set in `app.config.ts`
- [ ] `versionCode` is higher than the current Play Store build
- [ ] Android keystore backed up to secure vault
- [ ] `google-play-service-account.json` exists and has Release Manager role
- [ ] App tested on a physical Android device (API 35)
- [ ] App tested on a low-end Android device (2GB RAM, older CPU)
- [ ] Play Console: Data Safety section fully completed
- [ ] Play Console: store listing, screenshots, feature graphic all uploaded
- [ ] Content rating questionnaire completed in Play Console
- [ ] Internal Testing track tested by ≥ 2 people before promoting to Production
- [ ] `serviceAccountKeyPath` in `eas.json` points to correct file (not placeholder)


***

## 🎨 Vuexy Widget Catalog Reference

> **Complete component library:** See `../VUEXY_WIDGET_CATALOG.md` for detailed patterns

### Available Components

All Vuexy components are documented with:
- HTML/CSS patterns
- React/Next.js implementations
- React Native mobile equivalents
- TypeScript types
- Usage examples
- Accessibility guidelines

### Component Categories

1. **Card Components** (10+ variants)
   - Basic cards, image cards, horizontal cards
   - Colored cards, outline cards, label cards
   - Card groups, grid layouts, masonry

2. **Statistics Cards** (5+ variants)
   - Simple stat cards with icons
   - Trend cards with percentage changes
   - Progress stat cards with bars
   - Circular progress indicators
   - Multi-metric cards

3. **Progress & Metrics**
   - Linear progress bars (striped, animated)
   - Circular progress (doughnut charts)
   - Multi-segment progress bars
   - Percentage indicators

4. **Lists & Tables**
   - List groups with badges
   - Data tables with sorting
   - Responsive tables
   - Action tables with buttons

5. **Badges & Labels**
   - Solid, outline, light variants
   - Pill badges, rounded badges
   - Status indicators
   - Notification badges

6. **Buttons & Actions**
   - Solid, outline, flat styles
   - Icon buttons, loading states
   - Button groups, dropdowns
   - Floating action buttons

7. **Layout Patterns**
   - Grid system (12-column)
   - Sidebar layouts
   - Card grids
   - Responsive containers

### Color System

```typescript
// Vuexy color tokens (use these everywhere)
const colors = {
  primary: '#7367F0',
  secondary: '#82868B',
  success: '#28C76F',
  danger: '#EA5455',
  warning: '#FF9F43',
  info: '#00CFE8',
  
  // Light variants (12% opacity)
  lightPrimary: 'rgba(115, 103, 240, 0.12)',
  lightSuccess: 'rgba(40, 199, 111, 0.12)',
  lightDanger: 'rgba(234, 84, 85, 0.12)',
  lightWarning: 'rgba(255, 159, 67, 0.12)',
  
  // Surface colors
  surface: '#FFFFFF',
  background: '#F8F7FA',
  text: '#4B465C',
  textSecondary: '#A8AAAE',
  border: '#DBDADE',
};
```

### Responsive Breakpoints

```typescript
// Vuexy breakpoints (Bootstrap 5)
const breakpoints = {
  xs: 0,      // Mobile portrait
  sm: 576,    // Mobile landscape
  md: 768,    // Tablet
  lg: 992,    // Desktop
  xl: 1200,   // Large desktop
  xxl: 1400,  // Extra large desktop
};
```

### Implementation Rules

1. **Web (Next.js):**
   - Use Vuexy HTML/CSS classes directly
   - Create React components in `packages/ui`
   - Import from `@lms/ui` in apps

2. **Mobile (React Native):**
   - Recreate Vuexy visual style with NativeWind
   - Use `app-*` color tokens (e.g., `app-primary`, `app-surface`)
   - Match spacing, typography, shadows from Vuexy

3. **Shared Components:**
   - All UI components go in `packages/ui`
   - Export both web and mobile versions
   - Use conditional exports if needed

### Quick Start

```tsx
// Web usage
import { StatCard, TrendStatCard, Button } from '@lms/ui';

<StatCard 
  icon={<i className="icon-users" />}
  value="1,234"
  label="Total Users"
  variant="primary"
/>

// Mobile usage
import { StatCard } from '@/components/ui/StatCard';

<StatCard 
  icon="users"
  value="1,234"
  label="Total Users"
  variant="primary"
/>
```

### Resources

- **Full Catalog:** `../VUEXY_WIDGET_CATALOG.md`
- **Vuexy Demo:** https://demos.pixinvent.com/vuexy-html-admin-template/
- **Bootstrap 5 Docs:** https://getbootstrap.com/docs/5.3/
- **Feather Icons:** https://feathericons.com/

***

_Last updated: 2026-02-27 by Claude Code_
