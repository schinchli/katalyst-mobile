# LearnKloud.Today — Google Play Store Listing
> Package: `today.learnkloud.app` | Version: `1.0.0` (versionCode 38) | Last updated: 2026-04-19

---

## App Identity

| Field | Value |
|---|---|
| Display name | LearnKloud.Today |
| Android package | `today.learnkloud.app` |
| Version | 1.0.0 |
| versionCode | 38 |
| Target SDK | 35 (Android 15) |
| Min SDK | 24 (Android 7.0) |
| Architecture | New Architecture ON, Hermes ON, 16KB page-size compliant |
| Category | Education |
| Support email | support@learnkloud.today |
| Privacy policy | https://lms-amber-two.vercel.app/privacy |
| Terms of service | https://lms-amber-two.vercel.app/terms |
| Delete account (web) | https://lms-amber-two.vercel.app/delete-account |
| Delete account (in-app) | Profile → Danger Zone → Delete Account (requires typing DELETE) |

---

## Store Listing Content

### App name (30 chars max)
```
LearnKloud.Today
```

### Short description (80 chars max)
```
AWS, GCP & Azure cert prep: quizzes, flashcards & learning paths
```

### Full description (4000 chars max)
```
LearnKloud.Today is the fastest way to prepare for AWS, Google Cloud (GCP), and Microsoft Azure cloud certification exams — all on one app.

🎯 WHAT YOU GET
• 400+ practice questions covering AWS, GCP, and Azure fundamentals
• Instant answer explanations with elimination reasoning for every option
• Flashcards for rapid service recall
• Smart learning paths tailored to your exam target
• Leaderboard and streak system to keep you motivated
• Offline-ready quizzes — study on the go

📋 CERTIFICATION TRACKS
• AWS Certified Cloud Practitioner (CLF-C02)
• AWS Certified AI Practitioner (AIP-C01)
• AWS Solutions Architect Associate (SAA-C03)
• AWS Developer Associate (DVA-C02)
• AWS SysOps Administrator (SOA-C02)
• Google Cloud Digital Leader
• Microsoft Azure Fundamentals (AZ-900)

🧠 HOW IT WORKS
Take a domain-specific quiz, review each answer with elimination reasoning, tap the AWS/GCP/Azure docs link to go deeper, then track your progress on the leaderboard. Repeat until you pass.

🌩 CLOUD SERVICES COVERED
Amazon EC2, S3, Lambda, RDS, DynamoDB, VPC, IAM, CloudFront, ECS, EKS, SageMaker, Bedrock, Google Kubernetes Engine, Cloud Run, BigQuery, Vertex AI, Azure Virtual Machines, Azure Blob Storage, Azure Active Directory, and many more.

💡 EXAM TIPS
• Study one domain at a time using the curated learning paths
• Use flashcards to memorize service names and use cases
• Read the elimination reasoning on every wrong answer
• Target a 90%+ score in practice before booking your real exam

🔒 Your progress, streaks, and quiz history sync securely across devices via your LearnKloud.Today account.

Start free. Upgrade for unlimited quizzes and all certification tracks.
```

### Tags (5 max in Play Console)
```
AWS | cloud computing | certification | quiz | exam prep
```

---

## Permissions Declared

| Permission | Reason |
|---|---|
| `INTERNET` | Required to load quiz questions, sync progress, and authenticate via Supabase |
| `ACCESS_NETWORK_STATE` | Detect connectivity to show offline/online state gracefully |

No location, camera, microphone, contacts, SMS, or storage permissions are requested.

---

## Data Safety Declarations

### Data collected and why

| Data type | Collected | Shared | Required | Purpose |
|---|---|---|---|---|
| Email address | ✅ Yes | ❌ No | Yes (account) | Account creation and login |
| Name / display name | ✅ Yes | ❌ No | Optional | Shown on leaderboard |
| User ID | ✅ Yes | ❌ No | Yes | App functionality |
| App activity (quiz history, progress, streaks) | ✅ Yes | ❌ No | Yes | App functionality — progress sync across devices |
| Device or other IDs | ❌ Not collected | — | — | — |
| Precise location | ❌ Not collected | — | — | — |
| Approximate location | ❌ Not collected | — | — | — |
| Contacts | ❌ Not collected | — | — | — |
| Photos / media | ❌ Not collected | — | — | — |
| Financial info | ❌ Not collected | — | — | — |

### Security practices

| Practice | Status |
|---|---|
| Data encrypted in transit | ✅ Yes — HTTPS/TLS on all API calls |
| Data encrypted at rest | ✅ Yes — Supabase (AES-256) |
| Users can request data deletion | ✅ Yes — in-app (Profile → Delete Account) and web (URL above) |
| Data collection independent of app usage | ❌ No |

### Ads
- Contains ads: ❌ **No** — AdMob SDK is not integrated in this version. No ads are shown.

---

## Content Rating

Answers to the Play Console content rating questionnaire:

| Question | Answer |
|---|---|
| Category | Education |
| Violence | ❌ None |
| Sexual content | ❌ None |
| Profanity or crude humour | ❌ None |
| Controlled substances | ❌ None |
| Gambling or simulated gambling | ❌ None — coins/XP are non-monetary in-app rewards |
| User-generated content | ❌ No — users do not post content |
| Hate speech | ❌ None |

**Expected rating: Everyone (E)**

---

## Target Audience

| Field | Value |
|---|---|
| Target age group | 18 and over (professional certification candidates) |
| Appeals to children | ❌ No |
| Is a news app | ❌ No |

---

## Release Notes — Version 1.0.0

```
Version 1.0.0

• 400+ AWS, GCP and Azure certification practice questions
• Instant answer explanations with AWS documentation links
• Elimination reasoning for every option (learn why wrong answers are wrong)
• Flashcards for rapid service recall
• Leaderboard and daily streak system
• Covers: CLF-C02, AIP-C01, SAA-C03, DVA-C02 and more
```

---

## What Is Not Yet Integrated (for auditor awareness)

| Feature | Status | Notes |
|---|---|---|
| AdMob / Google Mobile Ads SDK | ❌ Not installed | Banner and interstitial hooks are stubs. No ads shown. Do not declare in Data Safety. |
| Razorpay (payments) | ⚠️ Backend wired, not active in this build | Payment flow exists but no active subscription products configured for Android |
| iOS build | ❌ Not submitted | Android-only submission for this launch |

---

## GitHub Repositories

| Repo | URL | Contents |
|---|---|---|
| Mobile (React Native / Expo) | https://github.com/schinchli/katalyst-mobile | All screens, quiz logic, auth, stores |
| Web (Next.js / Vercel) | https://github.com/schinchli/katalyst-lms-web | API routes, web dashboard, quiz data |

### Key paths for audit

| What | Path in `katalyst-mobile` |
|---|---|
| App entry & routing | `app/_layout.tsx`, `app/(tabs)/` |
| Auth flow (login/signup/reset) | `app/(auth)/` |
| Quiz engine | `app/quiz/[id].tsx` |
| Leaderboard | `app/leaderboard.tsx` |
| Flashcards | `app/flashcards.tsx` |
| Learning paths | `app/learning-path.tsx` |
| Profile + Delete Account | `app/(tabs)/profile.tsx` |
| Ad stubs (no SDK) | `components/ads/`, `hooks/useInterstitialAd.ts` |
| Supabase client | `config/supabase.ts` |
| Auth store | `stores/authStore.ts` |
| Permissions declared | `app.json` → `expo.android.permissions` |
| EAS build config | `eas.json` |
| Store metadata | `store.config.json` |

| What | Path in `katalyst-lms-web` |
|---|---|
| Privacy policy page | `apps/web/src/app/privacy/page.tsx` |
| Terms of service page | `apps/web/src/app/terms/page.tsx` |
| Delete account page | `apps/web/src/app/delete-account/page.tsx` |
| Account deletion API | `apps/web/src/app/api/delete-account/route.ts` |
| Auth API | `apps/web/src/app/api/auth/` |
| Quiz submit (server-side validation) | `apps/web/src/app/api/quiz-submit/route.ts` |
| Leaderboard API | `apps/web/src/app/api/leaderboard/route.ts` |
| Security headers | `apps/web/next.config.ts` |
