# Katalyst — Feature List

> Status key: ✅ Done · 🚧 In Progress · 📋 Planned · ❌ Blocked

---

## Core Learning

| Feature | Status | Notes |
|---------|--------|-------|
| Quiz player (MCQ, instant feedback) | ✅ | 30s timer, immediate result per question |
| Per-question countdown timer (30s) | ✅ | Color changes: green → amber → red |
| 50/50 lifeline (eliminates 2 wrong) | ✅ | Single use per quiz session |
| Skip lifeline (3 skips/session) | ✅ | |
| Question bookmarking | ✅ | Persisted via AsyncStorage |
| Question reporting (flag issues) | ✅ | In-quiz report modal |
| Flashcard mode (flip animation) | ✅ | 3D Y-axis flip (Reanimated v4) |
| Review mode (post-quiz walkthrough) | ✅ | Navigate all questions with answers shown |
| Explanation text per question | ✅ | Shown on result reveal |
| Category filter on quiz list | ✅ | 12 categories + "All" |

## Content

| Feature | Status | Notes |
|---------|--------|-------|
| Bedrock Fundamentals quiz (10q) | ✅ | |
| RAG & Knowledge Bases quiz (10q) | ✅ | |
| AI Agents quiz (10q) | ✅ | |
| Prompt Engineering quiz (10q) | ✅ | |
| Security & Compliance quiz (10q) | ✅ | |
| Monitoring & Observability quiz (10q) | ✅ | |
| MLOps & SageMaker quiz (10q) | ✅ | |
| Guardrails & Safety (10q) | 🚧 | Questions need content |
| Multi-LLM Routing (10q) | 🚧 | Questions need content |
| Orchestration & Step Functions (10q) | 🚧 | Questions need content |
| Evaluation & Testing (10q) | 🚧 | Questions need content |
| GenAI Mega Quiz (20q) | 🚧 | Questions need content |

## Gamification

| Feature | Status | Notes |
|---------|--------|-------|
| XP system (earn on quiz completion) | ✅ | |
| Coin system (correct answers) | ✅ | |
| Level system (Novice → Grandmaster) | ✅ | 10 levels |
| Badge system (achievements) | ✅ | First Quiz, High Achiever, Speed Demon, Streak Master, Category Master |
| Daily streak tracking | ✅ | Resets if missed a day |
| Leaderboard screen | ✅ | Top 15 players (mock data) |
| Daily Quiz (auto-selected per date) | ✅ | |
| Challenge Arena (vs CPU) | ✅ | Per-quiz CPU target scores |
| Contest/Tournament screen | ✅ | Live, upcoming, finished states |

## Progress & Analytics

| Feature | Status | Notes |
|---------|--------|-------|
| Progress screen (per-category bars) | ✅ | |
| Best score highlight card | ✅ | |
| Recent results list | ✅ | Last 5 quiz attempts |
| Badges earned grid | ✅ | |
| Average score tracking | ✅ | |

## Navigation & UX

| Feature | Status | Notes |
|---------|--------|-------|
| Bottom tab navigation (mobile) | ✅ | Home, Quizzes, Search, Bookmarks, Progress, Profile |
| Sidebar navigation (web/desktop) | ✅ | Vuexy-style sidebar with section label |
| Tab bar active pill indicator | ✅ | Top dot + icon background |
| Quiz intro screen | ✅ | Cover card, metadata boxes, features list |
| Results/Scoreboard screen | ✅ | Score circle, stat cards, question breakdown |
| Search screen | ✅ | Full-text search across all questions |
| Bookmarks screen | ✅ | Saved questions with quick review |
| Profile screen | ✅ | Avatar, XP bar, stats, menus |
| Auth (login/register) | ✅ | Mocked — Cognito pending |
| Deep linking (Expo Router) | ✅ | File-based routing |
| Web bundle (Metro/SPA) | ✅ | 2.55 MB |

## Brand & Theme

| Feature | Status | Notes |
|---------|--------|-------|
| Vuexy design system (base) | ✅ | All colors, typography, shadows |
| Light mode | ✅ | |
| Dark mode | ✅ | `primaryText` token provides WCAG AA contrast in all 6 accent presets |
| `primaryText` accessibility token | ✅ | Per-accent text color (light + dark variants); fixes secondary/outline button contrast failure (was 2.19:1 → 4.5:1+) |
| Brand color customization (in Profile) | ✅ | 6 presets: Purple, Teal, Emerald, Amber, Rose, Indigo |
| Theme persisted via AsyncStorage | ✅ | Survives app restarts |
| Premium dark flashcards | ✅ | Quizlet night × MasterClass aesthetic |
| Opacity-suffix color pattern | ✅ | `accent + '18'`/`'22'` replaces hardcoded light-only bg colors in QuizCard + index.tsx |

## Monetization

| Feature | Status | Notes |
|---------|--------|-------|
| AdBanner component (stub) | ✅ | Real AdMob needs EAS Dev Client |
| Interstitial ad hook (stub) | ✅ | Fires every 5 questions |
| Premium gate modal | ✅ | Locks isPremium quizzes |
| PRO badge on quiz cards | ✅ | |
| RevenueCat integration | 📋 | Needs bundle ID + Apple/Google setup |

## Infrastructure

| Feature | Status | Notes |
|---------|--------|-------|
| Expo SDK 54 + React Native 0.81 | ✅ | |
| Expo Router v6 file-based routing | ✅ | |
| Zustand state (auth, progress, quiz, bookmark, theme) | ✅ | |
| AsyncStorage persistence | ✅ | |
| TanStack Query v5 (scaffolded) | ✅ | Ready for backend integration |
| TypeScript strict mode | ✅ | 0 errors |
| Jest 218/218 tests passing | ✅ | 18 test suites |
| Web export (Metro bundler) | ✅ | |
| iOS HBC export | ✅ | |
| Cognito auth | 📋 | |
| AWS CDK backend | 📋 | |
| EAS Build configuration | 📋 | |
| Push notifications | 📋 | |
| OTA updates (EAS Update) | 📋 | |

## Web Portal (`apps/web`)

| Feature | Status | Notes |
|---------|--------|-------|
| Next.js 16.1.6 (Turbopack) | ✅ | Running at http://localhost:3000 |
| Dashboard with stats cards | ✅ | Completion %, avg score, best score, quizzes taken |
| Quizzes grid (Vuexy Top Courses style) | ✅ | Category filter, difficulty stars, PRO/Done badges |
| Full quiz player | ✅ | Intro → Quiz → Results phases, 30s timer, instant feedback |
| Progress history table | ✅ | Pass/fail status, per-quiz scores, dates |
| Editable profile | ✅ | Display name, email, level, danger zone reset |
| Sidebar navigation | ✅ | Active-route highlighting, Vuexy CSS tokens |
| localStorage CRUD | ✅ | quiz-results, profile-name, profile-email |
| HTTP security headers | ✅ | X-Frame-Options, CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Dark mode CSS tokens | ✅ | CSS variables for both light and dark themes |

## Elite Quiz PHP Admin Panel

| Feature | Status | Notes |
|---------|--------|-------|
| PHP admin panel running locally | ✅ | http://localhost:8080 — admin / admin123 |
| MySQL database seeded | ✅ | elite_quiz_238 — all tables imported |
| PHP 8.5.3 compatibility | ✅ | E_STRICT + session.sid_length deprecations fixed |
| CSRF protection | ✅ | CodeIgniter built-in `csrf_protection = TRUE` |
| File upload security | ✅ | Extension allowlist, path traversal regex, CI input sanitization |
| Error view XSS fix | ✅ | All echo in error_php.php wrapped with htmlspecialchars |
| Admin battle/contest management | ✅ | Full CRUD via CodeIgniter 3 |
| REST API | ✅ | JWT-authenticated API for mobile/web clients |

---

_Last updated: 2026-02-27 by Claude Code_
