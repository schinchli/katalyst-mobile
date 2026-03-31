/**
 * Design tokens — Vuexy-aligned, synchronized with web globals.css tokens.
 * Dark: matches [data-theme="dark"] on web.
 * Light: matches :root on web.
 */

export interface ThemeColors {
  // Text
  text:            string;
  textSecondary:   string;
  textMuted:       string;
  // Backgrounds
  background:      string;
  backgroundAlt:   string;
  surface:         string;
  surfaceElevated: string;
  surfaceBorder:   string;
  // Primary (overridable via themeStore accent presets)
  primary:         string;
  primaryLight:    string;
  primaryText:     string;  // WCAG AA accessible on surface
  gradientFrom:    string;
  gradientTo:      string;
  gradientAccent:  string;
  // Navigation aliases
  tint:            string;
  tabIconDefault:  string;
  tabIconSelected: string;
  // Status — functional only (no cyan info)
  success:         string;
  warning:         string;
  error:           string;
  info:            string;  // alias → primary
  aws:             string;
}

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    text:            '#0F172A',
    textSecondary:   '#6B7280',
    textMuted:       '#94A3B8',
    background:      '#F6F8FB',
    backgroundAlt:   '#EEF2F7',
    surface:         '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceBorder:   '#E5E7EB',
    primary:         '#0EA5E9',
    primaryLight:    '#E0F7FF',
    primaryText:     '#026AA2',
    gradientFrom:    '#6C5BFF',
    gradientTo:      '#36E5F0',
    gradientAccent:  '#A855F7',
    tint:            '#0EA5E9',
    tabIconDefault:  '#9CA3AF',
    tabIconSelected: '#0EA5E9',
    success:         '#10B981',
    warning:         '#F59E0B',
    error:           '#EF4444',
    info:            '#0EA5E9',
    aws:             '#F59E0B',
  },

  dark: {
    text:            '#E5E7EB',
    textSecondary:   '#93A4C4',
    textMuted:       '#6C7DA5',
    background:      '#050B18',
    backgroundAlt:   '#0A1327',
    surface:         '#101C36',
    surfaceElevated: '#162443',
    surfaceBorder:   '#1F315A',
    primary:         '#4B5EFA',
    primaryLight:    'rgba(75,94,250,0.14)',
    primaryText:     '#A5B4FC',
    gradientFrom:    '#4B5EFA',
    gradientTo:      '#0EA5E9',
    gradientAccent:  '#22D3EE',
    tint:            '#4B5EFA',
    tabIconDefault:  '#7083AD',
    tabIconSelected: '#4B5EFA',
    success:         '#28C76F',
    warning:         '#F59E0B',
    error:           '#EF4444',
    info:            '#2E9BFF',
    aws:             '#F59E0B',
  },
};

export type ColorScheme = keyof typeof Colors;
