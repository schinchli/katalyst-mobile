# LearnKloud.Today — Google Play Store Submission Guide
> Last updated: 2026-04-18 | Version 1.0.0 (versionCode 33+) | Package: today.learnkloud.app

---

## CURRENT APP STATE SNAPSHOT

| Field | Value |
|---|---|
| Display name | LearnKloud.Today |
| Android package | today.learnkloud.app |
| Version | 1.0.0 |
| versionCode | 32 (last preview build) — use 33+ for first Play Store build |
| Target SDK | 35 (Android 15) via Expo SDK 54 |
| Min SDK | 24 (Android 7.0) |
| Architecture | New Architecture ON, Hermes ON |
| 16KB page size | ✅ Compliant (RN 0.81 / SDK 54) |
| EAS project | katalyst (schinchli) |
| EAS project ID | db2edb2b-e3f3-4a88-84a9-8435c80db3f8 |
| Permissions | INTERNET, ACCESS_NETWORK_STATE, VIBRATE (minimal) |

---

## PHASE 1 — GOOGLE ACCOUNTS SETUP (one-time, do this first)

### 1.1 Google Play Developer Account
- Go to: https://play.google.com/console
- Sign in with your Google account (use schinchli@gmail.com or a dedicated business account)
- Pay the **$25 one-time registration fee** (credit card)
- Fill in developer name: **LearnKloud.Today** (this shows on Play Store to users)
- Accept the Developer Distribution Agreement
- Account approval: usually instant, sometimes up to 48h

### 1.2 Google Play Service Account (for EAS automated submissions)
This lets `eas submit` upload builds without manual intervention.

1. Go to: https://play.google.com/console → **Setup → API access**
2. Click **Link to a Google Cloud project** (create new or use existing)
3. In Google Cloud Console → **IAM & Admin → Service Accounts**
4. Click **Create Service Account**
   - Name: `eas-deploy`
   - Role: **Service Account User**
5. Create a JSON key: **Keys → Add Key → Create new key → JSON** → Download
6. Save as: `mobile/credentials/google-play-service-account.json`
7. Back in Play Console → **Users and Permissions → Invite new users**
   - Email: the service account email (e.g. `eas-deploy@your-project.iam.gserviceaccount.com`)
   - Role: **Release Manager**
8. Grant access to **LearnKloud.Today** app specifically

> ⚠️ `credentials/` is in .gitignore — never commit this file. Back it up to 1Password or a secure vault.

---

## PHASE 2 — FIRST MANUAL UPLOAD (mandatory for new apps)

Google requires the **first submission to be done manually** through Play Console. EAS automated submit only works for subsequent updates.

### 2.1 Trigger the Production Build

```bash
cd ~/Documents/Projects/lms/mobile

# Bump versionCode in app.json to 33 first (see Phase 3 below)
# Then run:
eas build --platform android --profile production --message "v1.0.0 Play Store submission"
```

This produces a signed `.aab` file. EAS handles signing automatically (it generates and stores the keystore).

**After the build completes:**
```bash
# Download the .aab from EAS dashboard or:
eas build:list --platform android --limit 3
# Note the Build ID, then download from the EAS dashboard URL shown
```

### 2.2 Create the App in Play Console

1. Go to: https://play.google.com/console
2. Click **Create app**
3. Fill in:
   - App name: **LearnKloud.Today**
   - Default language: **English (United States)**
   - App or game: **App**
   - Free or paid: **Free**
4. Accept the declarations → **Create app**

### 2.3 Upload the AAB

1. In your new app → **Release → Internal testing**
2. Click **Create new release**
3. Click **Upload** → upload the `.aab` file from step 2.1
4. Release name: `1.0.0 (33)` — auto-fills
5. Release notes (what's new): see template below
6. Click **Save** → **Review release** → **Start rollout**

---

## PHASE 3 — APP.JSON VERSION MANAGEMENT

Before every production build, bump the versionCode. EAS can auto-increment but it's safer to control manually:

```json
// app.json — update both fields before each Play Store build
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 33
    }
  }
}
```

**Rules (never break these):**
- `versionCode` must always increase — never reuse or lower
- `version` is the user-facing string (semantic: 1.0.0, 1.1.0, etc.)
- Current last versionCode used: **32** → next must be **33+**
- After a Play Store submission always tag git: `git tag v1.0.0 && git push --tags`

---

## PHASE 4 — PLAY CONSOLE STORE LISTING

Complete every section before submitting for review. Incomplete listings are rejected.

### 4.1 App Details (Main store listing)

**App name (30 chars max):**
```
LearnKloud.Today
```

**Short description (80 chars max):**
```
AWS, GCP & Azure cert prep: quizzes, flashcards & learning paths
```

**Full description (4000 chars max):** — already in `store.config.json`, copy from there.

**Category:** Education

**Tags (5 max in Play Console):**
```
AWS  |  cloud computing  |  certification  |  quiz  |  exam prep
```

### 4.2 Graphics Assets Required

| Asset | Size | Notes |
|---|---|---|
| App icon | 512×512 PNG, no alpha | Use `assets/images/icon.png` — resize from 1024×1024 |
| Feature graphic | 1024×500 PNG or JPG | Required — create in Canva/Figma |
| Phone screenshots | Min 2, max 8 per device | 1080×1920 or 1080×2400 (portrait) |
| 7-inch tablet (optional) | 1200×1920 | Skip for initial submission |
| 10-inch tablet (optional) | 1600×2560 | Skip for initial submission |

**Screenshot content to capture (run the preview APK on your Samsung):**

1. Home screen — quiz category grid
2. Quiz question screen — showing a question with options
3. Explanation screen — after answering, showing ✓/✗ reasoning + AWS docs link
4. Leaderboard screen
5. Learning path / dashboard screen
6. Profile / progress screen

**How to capture:** Connect Samsung → `adb exec-out screencap -p > screenshot_name.png`

Or use the preview build already on your device and take screenshots manually.

### 4.3 Privacy Policy

Your privacy policy is already live at the web app. Confirm the URL:
```
https://lms-amber-two.vercel.app/privacy
```
Or better — set up `learnkloud.today/privacy` once your domain is live.

Enter this URL in Play Console → **App content → Privacy policy**.

---

## PHASE 5 — APP CONTENT DECLARATIONS

These are mandatory. Get them wrong and you get rejected or banned.

### 5.1 Content Rating Questionnaire

Play Console → **App content → Content rating** → Start questionnaire

Answer for LearnKloud.Today:
- Category: **Education**
- Violence: ❌ None
- Sexual content: ❌ None
- Profanity: ❌ None
- Controlled substances: ❌ None
- Gambling: ❌ None (coins are not real money gambling)
- User-generated content: ❌ No (users don't post content)
- Data sharing: ✅ Yes (account data, quiz progress)
- Ads: ✅ Yes (AdMob)

Expected rating: **Everyone (E)**

### 5.2 Data Safety Form

Play Console → **App content → Data safety**

| Data Type | Collected? | Shared? | Required? | Purpose |
|---|---|---|---|---|
| Email address | ✅ Yes | ❌ No | Yes (account) | Account management |
| Name | ✅ Yes | ❌ No | No (optional) | Display in leaderboard |
| User ID | ✅ Yes | ❌ No | Yes | App functionality |
| Quiz history / progress | ✅ Yes | ❌ No | Yes | App functionality |
| Device ID | ✅ Yes (AdMob) | ✅ Yes (Google) | Yes | Advertising |
| Approximate location | ❌ No | — | — | — |
| Precise location | ❌ No | — | — | — |
| Contacts | ❌ No | — | — | — |
| Photos / media | ❌ No | — | — | — |

**Security practices to declare:**
- Data encrypted in transit: ✅ Yes (HTTPS/TLS)
- Data encrypted at rest: ✅ Yes (Supabase)
- Users can request data deletion: ✅ Yes (learnkloud.today/delete-account)

### 5.3 Ads Declaration

Play Console → **App content → Ads**
- Does your app contain ads? ✅ **Yes**
- Ad SDK: AdMob (Google)

### 5.4 Target Audience

Play Console → **App content → Target audience and content**
- Target age group: **18 and over** (professional certification audience)
- Does your app appeal to children? ❌ **No**

### 5.5 News App Declaration

- Is this a news app? ❌ **No**

---

## PHASE 6 — RELEASE TRACKS STRATEGY

```
Internal Testing (up to 100 testers — you + team)
       ↓ (after 1-2 days of QA)
Closed Testing / Alpha (invite-only group, 50-200 users)
       ↓ (after 1 week)
Open Testing / Beta (public opt-in)
       ↓ (after 2 weeks)
Production — Staged rollout: 10% → 25% → 50% → 100%
```

**For first submission, start with Internal Testing only.** Do not rush to Production.

---

## PHASE 7 — PRE-BUILD CHECKLIST

Run through this before triggering `eas build --profile production`:

### Code
- [ ] `versionCode` bumped in `app.json` (must be > 32)
- [ ] `version` string updated if user-visible change (e.g. `1.0.0` → `1.0.1`)
- [ ] TypeScript: `npx tsc --noEmit` — zero errors
- [ ] No `console.log` in production code
- [ ] `expo-doctor` — zero warnings (Metro config warning is known — acceptable)
- [ ] No `.env` secrets committed
- [ ] `git status` clean — no uncommitted changes

### Assets
- [ ] `assets/images/icon.png` — 1024×1024 RGBA ✅ (already correct)
- [ ] `assets/images/adaptive-icon.png` — 1024×1024 RGBA ✅ (already correct)
- [ ] `assets/images/splash-icon.png` — 1024×1024 RGBA ✅ (already correct)
- [ ] Feature graphic created (1024×500) — **MISSING — create in Canva**
- [ ] Screenshots captured (min 2 phone) — **MISSING — take from device**

### EAS Config
- [ ] `eas.json` production profile has `"buildType": "app-bundle"` ✅
- [ ] `submit.production.android.serviceAccountKeyPath` points to valid JSON ✅ (path: `./credentials/google-play-service-account.json`)
- [ ] `credentials/google-play-service-account.json` exists locally ⚠️ **Need to create (Phase 1.2)**
- [ ] EAS logged in: `eas whoami` returns `schinchli` ✅

### Play Console
- [ ] Developer account active and $25 paid
- [ ] App created in Play Console with package `today.learnkloud.app`
- [ ] Service account linked with Release Manager role
- [ ] Internal Testing track created
- [ ] Store listing filled (all fields below)
- [ ] App icon uploaded (512×512)
- [ ] Feature graphic uploaded (1024×500)
- [ ] At least 2 phone screenshots uploaded
- [ ] Privacy policy URL entered
- [ ] Content rating questionnaire complete
- [ ] Data Safety form complete
- [ ] Ads declaration complete
- [ ] Target audience declared

---

## PHASE 8 — BUILD AND SUBMIT COMMANDS

```bash
cd ~/Documents/Projects/lms/mobile

# Step 1: Verify you're on the right branch with clean state
git status
git log --oneline -3

# Step 2: Bump versionCode in app.json
# Change "versionCode": 32 → 33

# Step 3: Commit the version bump
git add app.json
git commit -m "release: v1.0.0 (33) Play Store submission"
git tag v1.0.0
git push && git push --tags

# Step 4: Trigger production build
eas build --platform android --profile production

# Step 5: Monitor build at https://expo.dev/accounts/schinchli/projects/katalyst/builds
# Build takes 10-20 minutes

# Step 6a: For FIRST submission — download AAB and upload manually in Play Console
#          (Google requires first upload to be manual for new package names)

# Step 6b: For subsequent submissions — automated:
eas submit --platform android --profile production
# This reads credentials/google-play-service-account.json and uploads to Internal track
```

---

## PHASE 9 — WHAT'S LIVE ON DEVICE VIA OTA VS WHAT NEEDS A NATIVE BUILD

| Change | OTA Update ✅ | Native Build Required ❌ |
|---|---|---|
| Quiz questions / content | ✅ | |
| Screen text / UI labels | ✅ | |
| Explanation enrichment | ✅ | |
| Bug fixes in JS code | ✅ | |
| New screens (JS only) | ✅ | |
| App display name change | | ❌ (app.json `name`) |
| Bundle ID / package change | | ❌ (today.learnkloud.app) |
| New native module / SDK | | ❌ |
| App icon / splash change | | ❌ |
| Android permissions change | | ❌ |
| SDK version upgrade | | ❌ |

**The rebrand to `today.learnkloud.app` requires a new native build to take effect on devices.** OTA updates only affect JS bundle.

---

## PHASE 10 — POST-LAUNCH MONITORING

Once live on Play Store, monitor these:

| Signal | Threshold | Action |
|---|---|---|
| Crash-free sessions | < 98% | Ship OTA fix immediately |
| ANR rate | > 0.47% | File bug + OTA fix |
| 1-star reviews spike | Any cluster | Read reviews + respond |
| Rating drops below 3.5 | — | Pause rollout |

**Where to monitor:**
- Play Console → Android Vitals (crashes, ANRs, battery)
- Play Console → Ratings & Reviews
- EAS Dashboard → https://expo.dev/accounts/schinchli/projects/katalyst

**OTA fix workflow (no Play Store review needed):**
```bash
cd ~/Documents/Projects/lms/mobile
# fix the issue in code
git add . && git commit -m "fix: [describe fix]"
eas update --branch production --message "fix: [describe fix]" --platform android
```

---

## KNOWN ISSUES TO FIX BEFORE PRODUCTION

| Issue | Severity | Fix |
|---|---|---|
| `expo-doctor` Metro config warning | Low | Remove `disableHierarchicalLookup: true` from `metro.config.js` if it exists |
| Feature graphic missing | **Blocker** | Create 1024×500 PNG in Canva (required by Play Store) |
| Screenshots missing | **Blocker** | Capture 2-6 screens from physical device |
| Service account JSON not created | **Blocker** | Follow Phase 1.2 |
| `credentials/` folder not in repo | Expected | It's gitignored — store securely offline |

---

## RELEASE NOTES TEMPLATE (for Play Console "What's new")

```
Version 1.0.0

• 400+ AWS, GCP and Azure certification practice questions
• Instant answer explanations with direct AWS documentation links  
• Elimination reasoning for every option (learn why wrong answers are wrong)
• Flashcards for rapid service recall
• Leaderboard and daily streak system
• Covers: CLF-C02, AIP-C01, SAA-C03, DVA-C02 and more
```

---

## CONTACTS AND URLS

| Purpose | Value |
|---|---|
| Play Console | https://play.google.com/console |
| EAS Dashboard | https://expo.dev/accounts/schinchli/projects/katalyst |
| EAS Updates | https://expo.dev/accounts/schinchli/projects/katalyst/updates |
| Support email | support@learnkloud.today |
| Privacy policy | https://lms-amber-two.vercel.app/privacy |
| Delete account | https://lms-amber-two.vercel.app/delete-account |
