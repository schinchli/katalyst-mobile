# Katalyst Mobile — Changelog

## [Unreleased] — Active Development

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

---

_Auto-maintained by Claude Code. Last updated: 2026-02-25_
