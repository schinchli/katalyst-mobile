# Katalyst — Brand Guidelines

> **Parent Theme:** Vuexy v10.11.1 Design System
> All components must extend Vuexy base tokens. Custom components inherit from this foundation.

---

## 1. Brand Identity

| Property | Value |
|----------|-------|
| App Name | **Katalyst** |
| Platform | KataHQ |
| Tagline | *AWS GenAI Prep — Accelerate Your Cloud Career* |
| Logo Mark | Purple `zap` icon on rounded square |

---

## 2. Color System

### 2.1 Primary Accent (Configurable)
The accent color can be customized from **Profile → Brand Color**. The default is Vuexy Purple.

| Preset | Primary | Light Tint | Usage |
|--------|---------|------------|-------|
| 🟣 **Vuexy Purple** (default) | `#7367F0` | `#EBE9FD` | Active nav, CTAs, highlights |
| 🩵 Ocean Teal | `#00BAD1` | `#E0F9FC` | |
| 🟢 Emerald | `#28C76F` | `#D1F7E2` | |
| 🟡 Amber | `#FF9F43` | `#FFF3E8` | |
| 🔴 Rose | `#EA5455` | `#FFE0E0` | |
| 🔵 Deep Indigo | `#4B5EFA` | `#E8EAFF` | |

### 2.2 Fixed Semantic Colors
These never change regardless of accent preset:

| Token | Value | Usage |
|-------|-------|-------|
| Success | `#28C76F` | Correct answers, pass state, streak |
| Warning | `#FF9F43` | Intermediate level, coins, timers |
| Error / Danger | `#FF4C51` | Incorrect answers, fail state |
| Info | `#00BAD1` | Informational states |
| AWS Orange | `#FF9900` | AWS brand elements, PRO badges |

### 2.3 Light Mode Base (locked)

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#F8F7FA` | App background (`body-bg`) |
| Surface | `#FFFFFF` | Cards, modals |
| Surface Border | `#DBDADE` | Card borders, dividers |
| Text Primary | `#23212A` | Headings |
| Text Secondary | `#6A6B76` | Labels, descriptions |

---

## 3. Typography

All type uses **Inter** (variable font). Family constants live in `constants/Typography.ts`.

| Weight | Family Constant | CSS Equivalent | Usage |
|--------|----------------|----------------|-------|
| Bold | `F.bold` | `700` | Headings, scores, titles |
| SemiBold | `F.semiBold` | `600` | Sub-headings, button labels, badge text |
| Medium | `F.medium` | `500` | Body text, menu items |
| Regular | `F.regular` | `400` | Descriptions, hints, secondary text |

### Type Scale

| Size | Usage |
|------|-------|
| 26px | Screen titles (`.screenTitle`) |
| 22px | Results headings |
| 20px | Section headings, profile name |
| 18px | Card titles, quiz title in intro |
| 17px | Quiz header, modal titles |
| 15px | Card titles, menu labels |
| 14px | Body text, question options |
| 13px | Labels, meta text |
| 12px | Badges, pill text, hint text |
| 11px | Navigation labels, uppercase section headers |
| 10px | Tab bar labels |

---

## 4. Spacing & Radius

| Context | Value |
|---------|-------|
| Screen horizontal padding | `20px` |
| Card border radius (standard) | `12–16px` |
| Button border radius | `8–10px` |
| Badge/pill border radius | `6–20px` (contextual) |
| Avatar border radius | `50%` (full circle) |

---

## 5. Shadow System

| Level | shadowOpacity | shadowRadius | Elevation | Usage |
|-------|--------------|--------------|-----------|-------|
| Low | `0.04–0.05` | `4–6` | `1` | Options, secondary cards |
| Medium | `0.06–0.08` | `8–10` | `2–3` | Quiz cards, stat cards |
| High | `0.3–0.35` | `16–20` | `6–12` | Flashcards (colored glow) |

---

## 6. Component Standards

### 6.1 Cards
- `borderRadius: 14–16` for content cards
- `borderWidth: 1`, `borderColor: colors.surfaceBorder`
- Left accent bar (`width: 4–5, alignSelf: 'stretch'`) for quiz/question cards
- Always use `CARD_SHADOW` shadow preset

### 6.2 Buttons
- Primary: `backgroundColor: colors.primary`, white text, `borderRadius: 10`, purple glow shadow
- Outline: `borderWidth: 1.5`, `borderColor: colors.primary`, transparent bg
- Danger: `borderColor: colors.error`, error text
- Height: `48–52px` for primary CTAs

### 6.3 Badges / Pills
- Difficulty: dot + label, colored background at 10% opacity
- Count badges: `paddingHorizontal: 8–10`, `borderRadius: 12`
- Status badges: `fontFamily: F.bold`, `fontSize: 11–12`

### 6.4 Icons
- Library: **Feather** (via `@expo/vector-icons`)
- Note: `trophy` is NOT a valid Feather icon — use `award`
- Icon containers: `borderRadius: 8–12`, `backgroundColor: accent + '18'` (10% opacity)
- Standard icon sizes: 13 (tiny), 16, 18, 20, 22, 24, 32 (large empty state)

### 6.5 Navigation
- Mobile: Bottom tab bar (6 tabs) — active indicator dot + icon pill
- Desktop/Web: Left sidebar, 260px wide, Vuexy section label style

---

## 7. Flashcard Dark Theme (Special)
Flashcards use a standalone dark luxury palette — NOT the app's light theme.

| Role | Color |
|------|-------|
| Question background | `#13111F` (deep purple-black) |
| Answer background | `#0C1820` (deep blue-black) |
| Question strip | `#7367F0` (primary purple) |
| Answer strip | `#28C76F` (success green) |
| Question text | `#F0EEFF` (warm white) |
| Answer bubble bg | `#0E2B1E` (dark green tint) |
| Answer text | `#3DD68C` (vibrant green) |
| Explanation text | `#9994B8` (muted lavender) |

---

## 8. Voice & Tone
- **Confident but friendly** — not corporate, not casual
- Gamification language: "Streak", "XP", "Badges", "Arena", "Challenge"
- AWS domain language: proper capitalization (Amazon Bedrock, not "bedrock")
- CTA copy: "Start Practice", "Study with Flashcards", "Browse Quizzes"

---

## 9. Implementation Rules
1. Always use `useThemeColors()` for accent-aware colors — never hardcode the primary hex
2. Semantic colors (success/warning/error) can be hardcoded — they never change
3. Background and surface colors must come from `colors.background` / `colors.surface`
4. New screens must import `F` from `@/constants/Typography` — never use `fontWeight` numbers
5. All pressable elements must have `accessibilityRole` set
6. Minimum tap target: 44×44px

---

_Last updated: 2026-02-26 · Maintained by Claude Code_
