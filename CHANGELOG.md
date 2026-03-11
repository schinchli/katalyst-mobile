# Katalyst Mobile — Changelog

## [Unreleased] — Active Development

### 2026-03-11 — Mobile Folder Cleanup + Quiz UI Normalization

**Build and repo hygiene:**
- Added `scripts/clean.js` plus `npm run clean` and `npm run clean:cache` in `package.json`
- Expanded `.gitignore` to exclude generated cache/build output including `.turbo`, `coverage`, and `ios/DerivedData`
- Removed generated mobile output directories during cleanup so the repo no longer carries stale `dist` and iOS build artifacts
- `metro.config.js` now disables hierarchical lookup and keeps `watchFolders` empty to reduce monorepo resolver overhead

**Quiz UI cleanup:**
- Removed old `PRO` badge styling from the live quiz listing surfaces and replaced it with a simpler premium lock/access indicator
- Updated `components/quiz/QuizCard.tsx` and `app/(tabs)/quizzes.tsx` so premium state no longer looks like leftover legacy styling
- Updated `__tests__/QuizCard.test.tsx` and current feature docs to match the new premium indicator behavior

**Code quality:**
- `app/dev-config.tsx` now redirects via `useEffect` instead of render-time `setTimeout`
- `components/ExternalLink.tsx` no longer relies on a stale unused `@ts-expect-error`
- `stores/quizStore.ts` keeps question navigation synchronous instead of deferring through zero-delay timers

### 2026-03-11 — Admin-Managed Quiz Gating + Practice Flow Fixes

**Premium/free gating source of truth:**
- Added `config/quizCatalog.ts` with `QUIZ_CATALOG_OVERRIDES_KEY = 'quiz_catalog_overrides'`
- Added `services/quizCatalogService.ts` to sync quiz premium/free overrides from `app_settings`
- `app/_layout.tsx` now syncs quiz catalog overrides during app boot before splash is hidden
- Only `clf-c02-full-exam` is premium by default; the CLF-C02 domain quizzes are free unless admin overrides change them

**Quiz + flashcard fixes:**
- `app/quiz/[id].tsx`: running score is now derived from committed answers instead of drifting local state
- `app/quiz/[id].tsx`: previous-question navigation now restores the correct feedback state when revisiting answered questions
- `app/quiz/[id].tsx`: skip clears pending answer state cleanly
- `app/(tabs)/index.tsx`: removed the `Desktop only` copy and changed flashcard entries to open the targeted flashcard route with category context
- `app/flashcards.tsx`: accepts a `category` route param so the tapped home widget opens the right flashcard pack
- `app/_layout.tsx`: explicitly registers `flashcards` and `leaderboard` stack routes

**Progress logic:**
- `stores/progressStore.ts`: added result summarization helpers so streak, average score, recent results, and XP can be rebuilt from persisted attempts
- `stores/progressStore.ts`: `syncProgress()` now merges remote attempts into local growth data instead of only copying coarse totals
- `stores/progressStore.ts`: `initFromSupabase()` now rebuilds progress from saved results instead of only restoring a count

### Audit Results (2026-02-25)
- 12 quizzes in data/quizzes.ts; 6 have ZERO questions (guardrails-safety, multi-llm-routing, orchestration-step-functions, evaluation-testing, genai-mega-quiz, multi-llm-routing)
- Only 70/130 questions implemented (54%)
- Auth is mocked with setTimeout
- AdMob stubs in place (needs EAS Dev Client to activate)
- Quiz Online V-7.1.6 features identified for porting: timer, lifelines, bookmarks, daily quiz, leaderboard

### Milestones

#### M1 — Fix Babel + Metro (DONE)
- Created babel.config.js (was missing entirely)
- Fixed nativewind/babel plugin (v4 uses Metro, not Babel)
- Fixed metro.config.js to include workspace root node_modules
- Added @babel/runtime dependency

#### M2 — Ad stubs for Expo Go (DONE)
- Stubbed AdBanner.native.tsx
- Stubbed useInterstitialAd.native.ts

#### M3 — Commandments updated (DONE)
- Added Xcode 26 deadline (§12.4a)
- Added Commandment 13 — Full Store Deployment (10 sections)
- Added Pre-Store Submission Checklist

#### M4 — Quiz features + data audit (DONE 2026-02-25)
- [ ] guardrails-safety (10 questions)
- [ ] multi-llm-routing (10 questions)
- [ ] orchestration-step-functions (10 questions)
- [ ] evaluation-testing (10 questions)
- [ ] genai-mega-quiz (20 questions)

#### M5 — Port Quiz Online V-7.1.6 features (PLANNED)
- [ ] Per-question countdown timer
- [ ] 50/50 lifeline
- [ ] Skip lifeline
- [ ] Bookmark questions
- [ ] Daily Quiz mode
- [ ] Leaderboard screen
- [ ] Scoring/coin system

#### M6 — Vuexy reskin all screens (PLANNED)
- [ ] Home screen
- [ ] Quizzes list
- [ ] Quiz player
- [ ] Progress screen
- [ ] Profile screen
- [ ] Auth screens

#### M7 — Code Audit + Bug Fixes + MLOps Content (DONE 2026-02-26)

**Bug fixes:**
- `leaderboard.tsx`: Removed dead `MedalIcon` component and `MEDAL_ICONS` array (never referenced)
- `search.tsx`: Fixed `EmptyState` icon — no-query state now shows `compass` instead of duplicate `search`
- `progress.tsx`: Fixed React key for `RecentResultCard` — changed `key={idx}` to stable `key={quizId+completedAt}`
- `progress.tsx`: Fixed `evaluation` category icon from `bar-chart` to `bar-chart-2` (consistent with AppTabBar)
- `progress.tsx`: Added missing `mlops` category to `categoryIcons` and `categoryAccent` maps
- `index.tsx`: Added missing `mlops` to `CAT_ICON` and `CAT_COLOR` maps
- `quizzes.tsx`: Added `mlops` to category filter list, `categoryIconBg`, and `categoryIconColor`

**New content:**
- Added `mlops-sagemaker` quiz (10 questions, intermediate difficulty) covering SageMaker Pipelines, Model Registry, Feature Store, A/B testing via Production Variants, Model Monitor, Asynchronous Inference, Multi-Model Endpoints, SageMaker Clarify, and MLOps automation patterns
- Updated `challenges.ts` — added `mlops-sagemaker` entry with CPU opponent "MLOpsBot" (score: 70)
- Quiz count: 13 quizzes, 140 questions total (was 12/130)

**Build validation:**
- TypeScript: 0 errors (`npx tsc --noEmit`)
- Tests: 218/218 passing (17 test suites)
- Web bundle: ✅ 2.55 MB SPA
- iOS bundle: ✅ 4.48 MB HBC

#### M8 — Visual Redesign + Theme System (DONE 2026-02-26)

**Visual redesign (premium app aesthetic):**
- `FlashCard.tsx`: Full dark luxury rewrite — deep purple/teal palette, 3D Y-axis flip, purple/green card glows, counter pill, label dots, dark answer bubble
- `QuizCard.tsx`: Premium redesign — difficulty-colored icon backgrounds (ICON_BG map), dot in badge, accent chevron wrap, deeper shadows, scale press animation
- `QuestionView.tsx`: Premium touches — thicker 5px left border, rounder options (14px radius), zap icon for explanation, `string` type annotations for TS compatibility
- `app/(tabs)/index.tsx`: Fixed `trophy`→`award` icon, removed "Continue Learning" section, renamed desktop block to "Start Practicing"
- `app/(tabs)/quizzes.tsx`: Removed duplicate local QuizCard, now uses shared `@/components/quiz/QuizCard`
- `app/quiz/[id].tsx`: Improved intro course card (difficulty strip color, chip with dot indicator), improved results screen with double-ring score circle + glow effect
- `components/ui/AppTabBar.tsx`: Premium mobile tab bar — top indicator dot, icon background pill for active tab, drop shadow; desktop: wider logo, AWS GenAI subtitle

**Theme customization system:**
- New `stores/themeStore.ts` — 6 accent presets: Vuexy Purple (default), Ocean Teal, Emerald, Amber, Rose, Deep Indigo
- Updated `hooks/useThemeColor.ts` — dynamically overrides `primary` + `primaryLight` from accent preset
- Updated `constants/Colors.ts` — exported `ThemeColors` interface (removes overly-strict literal types)
- Profile screen — new "BRAND COLOR" section with color picker (inline grid of 6 presets, persisted to AsyncStorage)

**Test fixes:**
- `FlashCard.test.tsx`: Updated to match redesigned text — `QUESTION`/`ANSWER` (uppercase), split counter nodes, `Tap to reveal answer` hint
- `jest.setup.ts`: Added `themeStore` mock to prevent Zustand/React init issues in test environment

**New files:**
- `FEATURES.md` — complete feature list with implementation status
- `__tests__/themeStore.test.ts` — 7 unit tests for accent preset config

**Build validation:**
- TypeScript: 0 errors
- Tests: 225/225 passing (18 test suites)
- Web bundle: ✅ 2.55 MB SPA
- iOS bundle: ✅ 4.48 MB HBC

#### M9 — UI Overhaul: Token System + Contrast Fixes (DONE 2026-02-27)

**`primaryText` accessibility token:**
- `constants/Colors.ts`: Added `primaryText: string` to `ThemeColors` interface; light `#5E53E0`, dark `#C4BFFF`
- `stores/themeStore.ts`: Added `primaryText`/`primaryTextDark` to `AccentConfig` and all 6 presets (WCAG AA verified per-accent values)
- `hooks/useThemeColor.ts`: Wired `primaryText` override in both `useThemeColor()` and `useThemeColors()`

**Component fixes:**
- `components/ui/Button.tsx`: Fixed secondary/outline dark mode contrast failure (was 2.19:1 → now 4.5:1+); `colors.primary` → `colors.primaryText` for text, border, and `ActivityIndicator`
- `components/ui/Card.tsx`: Upgraded shadow — opacity 0.04→0.10, radius 6→12, elevation 1→3
- `components/quiz/QuizCard.tsx`: Removed hardcoded `DIFF_BG`/`ICON_BG` constants; replaced with `accent + '18'` / `accent + '22'` (dark mode compatible)
- `app/(tabs)/index.tsx`: Full refactor — removed hardcoded `T` constant; introduced `StatColorType = 'primary' | 'success' | 'warning' | 'error'`; `StatCard`, `CategoryCoverage`, `coinPill`, `QuickActionsRow`, `dailyAccent` all use `colors[colorType]` dynamically

#### M10 — Quizzes Page Redesign: Vuexy Top Courses Grid (DONE 2026-02-27)

**`app/(tabs)/quizzes.tsx`** fully rewritten:
- Vuexy "Top Courses" 2-column card grid (3-column on desktop)
- `CourseCard` component: 100px color banner, icon circle, category chip, title, description, difficulty stars (1-3), divider, footer with meta + Start chip
- Stats header row: total quizzes, topic count, completed count badges
- Done badge (top-left), PRO badge (top-right)
- `completedIds` derived from `useProgressStore` `recentResults`

#### M11 — Web Portal Built from Scratch (DONE 2026-02-27)

**New app: `/Users/schinchli/Documents/Projects/lms/apps/web`** — Next.js 16.1.6 (Turbopack)

Pages built:
- `/dashboard` — Stats cards, quiz list, progress card
- `/dashboard/quizzes` — Vuexy course grid with category filter
- `/dashboard/quiz/[id]` — Full quiz player (intro / quiz / results phases), 30s per-question timer, instant feedback, score tracking
- `/dashboard/progress` — 4 stat cards, progress bar, quiz history table
- `/dashboard/profile` — Editable name/email, avatar, level badge, danger zone reset

Infrastructure:
- Vuexy CSS design tokens in `globals.css` (dark/light CSS variables)
- Sidebar layout with active-route highlighting
- All state via `localStorage` (`quiz-results`, `profile-name`, `profile-email`)
- Data shared from `mobile/data/quizzes.ts` (copied)
- **URL**: `http://localhost:3000`

#### M12 — Elite Quiz PHP Admin Panel Setup (DONE 2026-02-27)

**PHP admin panel extracted and running locally:**
- Source: `Elite quiz v.2.3.8/Elite Quiz - Admin Panel - v2.3.8.zip`
- Extracted to: `/Users/schinchli/Documents/Projects/elite-quiz-admin/php-admin/`
- MySQL database `elite_quiz_238` created and seeded from `install/assets/quiz.php` (all tables imported)
- PHP built-in server router (`router.php`) created for CodeIgniter 3 clean-URL routing
- **URL**: `http://localhost:8080`
- **Credentials**: `admin` / `admin123`

PHP 8.5.3 compatibility fixes applied:
- `E_STRICT` deprecated constant → replaced with numeric `8192`
- `session.sid_length` `ini_set` deprecated in PHP 8.4 → guarded with `PHP_VERSION_ID < 80400`

#### M13 — Security Audit & Fixes (DONE 2026-02-27)

**PHP Admin Panel fixes:**
- `Settings.php` + `Fun_N_Learn.php`: `$_POST['filetype']` direct superglobal → `$this->input->post('filetype')` (CI sanitizing helper); added `else { $valid_ext = []; }` guard to prevent uninitialized variable on unknown types; added `!empty($valid_ext)` check before `in_array()`
- `views/errors/html/error_php.php`: All `echo` calls wrapped with `htmlspecialchars(ENT_QUOTES, UTF-8)` to prevent XSS via error messages

**Next.js Web Portal fixes:**
- `next.config.ts`: Added HTTP security headers — `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Content-Security-Policy` with `frame-ancestors 'none'`

**Mobile — no issues found:**
- No `dangerouslySetInnerHTML` usage
- No hardcoded secrets or API keys (all via `process.env` / GitHub Secrets)
- Auth tokens not stored in AsyncStorage (quiz progress/preferences only — acceptable)

---

_Auto-maintained by Claude Code. Last updated: 2026-02-27_
