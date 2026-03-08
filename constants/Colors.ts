/**
 * Design tokens — aligned with Elite Quiz Admin Panel (Vuexy semi-dark).
 *
 * Palette rules (mirror admin panel vuexy.css):
 *  - Primary accent : #7367F0 (Vuexy purple) — overridable via themeStore
 *  - Text           : ONE dark shade (#4B465C light / #E3E7FA dark)
 *  - Muted text     : ONE muted shade (#A3A0B3) — same value in both modes
 *  - Semantic status: success / danger / warning only — no separate info/cyan
 *  - Dark bg        : #283046 — exact match to admin sidebar (semi-dark)
 */

export interface ThemeColors {
  // Text
  text:            string;
  textSecondary:   string;
  // Backgrounds
  background:      string;
  surface:         string;
  surfaceBorder:   string;
  // Primary (overridable via themeStore accent presets)
  primary:         string;
  primaryLight:    string;
  primaryText:     string;  // WCAG AA accessible on surface
  // Navigation aliases
  tint:            string;
  tabIconDefault:  string;
  tabIconSelected: string;
  // Status — functional only (no cyan info)
  success:         string;
  warning:         string;
  error:           string;
  info:            string;  // alias → primary (cyan removed)
  // Brand
  aws:             string;
}

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  /**
   * Light mode — matches admin panel content area
   * body-bg: #F8F7FA, card: #FFFFFF, border: #EBE9F1
   */
  light: {
    text:            '#4B465C',   // admin --vx-text (unified heading + body)
    textSecondary:   '#A3A0B3',   // admin --vx-text-muted (placeholders, hints)
    background:      '#F8F7FA',   // admin --vx-body-bg ✓
    surface:         '#FFFFFF',   // admin --vx-card-bg ✓
    surfaceBorder:   '#EBE9F1',   // admin --vx-border
    primary:         '#7367F0',   // admin --vx-primary ✓
    primaryLight:    '#EBE9FD',   // admin --vx-primary-light (opaque for RN)
    primaryText:     '#5E53E0',   // WCAG AA on white surface
    tint:            '#7367F0',
    tabIconDefault:  '#A3A0B3',   // matches textSecondary
    tabIconSelected: '#7367F0',
    success:         '#28C76F',   // admin --vx-success ✓
    warning:         '#FF9F43',   // admin --vx-warning ✓
    error:           '#EA5455',   // admin --vx-danger
    info:            '#7367F0',   // cyan removed — use primary (same as admin)
    aws:             '#FF9900',
  },

  /**
   * Dark mode — semi-dark palette matching admin sidebar aesthetic
   * bg: #283046 (admin sidebar), surface: #2F3349 (one shade lighter)
   */
  dark: {
    text:            '#E3E7FA',   // Vuexy dark headings — high contrast on #283046
    textSecondary:   '#A3A0B3',   // same muted shade as light mode — consistent
    background:      '#283046',   // admin --vx-sidebar-bg (semi-dark navy)
    surface:         '#2F3349',   // one step lighter — card/sheet bg
    surfaceBorder:   '#3B4059',   // subtle border on dark surface
    primary:         '#7367F0',   // same accent both modes ✓
    primaryLight:    '#352E6B',   // primary tint on dark bg
    primaryText:     '#C4BFFF',   // WCAG AA on dark surface
    tint:            '#7367F0',
    tabIconDefault:  '#A3A0B3',   // same muted shade — consistent
    tabIconSelected: '#7367F0',
    success:         '#28C76F',   // same both modes ✓
    warning:         '#FF9F43',   // same both modes ✓
    error:           '#EA5455',   // same both modes (admin --vx-danger)
    info:            '#7367F0',   // same both modes
    aws:             '#FF9900',
  },
};

export type ColorScheme = keyof typeof Colors;
