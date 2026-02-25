/**
 * Vuexy v10.11.1 design token values for React Native
 *
 * Used by:
 *  - useThemeColors() hook — for props that can't use NativeWind (icon colors, etc.)
 *  - React Navigation tabBarStyle / headerStyle
 *
 * All values must stay in sync with:
 *  - tailwind.config.js (app-* color keys)
 *  - global.css (--vx-* CSS variables)
 *  - packages/theme/src/tokens.ts (single source of truth)
 *
 * When Vuexy updates: change values in packages/theme/src/tokens.ts FIRST,
 * then copy updated hex values here and into tailwind.config.js.
 */

export const Colors = {
  light: {
    // ── Text ──────────────────────────────────────────────────────────────
    text:            '#23212A',  // Vuexy $headings-color
    textSecondary:   '#6A6B76',  // Vuexy $text-muted

    // ── Backgrounds ───────────────────────────────────────────────────────
    background:      '#F8F7FA',  // Vuexy $body-bg
    surface:         '#FFFFFF',  // Vuexy $card-bg
    surfaceBorder:   '#DBDADE',  // Vuexy $border-color

    // ── Primary (Vuexy purple) ─────────────────────────────────────────────
    primary:         '#7367F0',  // Vuexy $primary
    primaryLight:    '#EBE9FD',  // primary 10% tint

    // ── Aliases ───────────────────────────────────────────────────────────
    tint:            '#7367F0',
    tabIconDefault:  '#9EA1BA',
    tabIconSelected: '#7367F0',

    // ── Status ────────────────────────────────────────────────────────────
    success:         '#28C76F',  // Vuexy $success
    warning:         '#FF9F43',  // Vuexy $warning
    error:           '#FF4C51',  // Vuexy $danger
    info:            '#00BAD1',  // Vuexy $info

    // ── Brand ─────────────────────────────────────────────────────────────
    aws:             '#FF9900',
  },
  dark: {
    text:            '#E3E7FA',  // Vuexy $dark-headings-color
    textSecondary:   '#9EA1BA',  // Vuexy $dark-text-muted

    background:      '#25293C',  // Vuexy $dark-body-bg
    surface:         '#2F3349',  // Vuexy $dark-card-bg
    surfaceBorder:   '#4B4F66',  // Vuexy $dark-border-color

    primary:         '#7367F0',  // primary same in dark
    primaryLight:    '#43406B',  // primary-light in dark context

    tint:            '#7367F0',
    tabIconDefault:  '#6A6B76',
    tabIconSelected: '#7367F0',

    success:         '#28C76F',
    warning:         '#FF9F43',
    error:           '#FF4C51',
    info:            '#00BAD1',

    aws:             '#FF9900',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
