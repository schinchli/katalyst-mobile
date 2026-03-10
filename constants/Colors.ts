/**
 * Design tokens — aligned with refreshed web theme (blue/teal glassmorphism).
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
    background:      '#F6F8FB',
    surface:         '#FFFFFF',
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
    textSecondary:   '#9CA3AF',
    background:      '#0B1221',
    surface:         'rgba(19,25,38,0.9)',
    surfaceBorder:   '#1F2937',
    primary:         '#0EA5E9',
    primaryLight:    'rgba(14,165,233,0.14)',
    primaryText:     '#38BDF8',
    gradientFrom:    '#7C6CFF',
    gradientTo:      '#3DDFF0',
    gradientAccent:  '#C084FC',
    tint:            '#0EA5E9',
    tabIconDefault:  '#9CA3AF',
    tabIconSelected: '#0EA5E9',
    success:         '#10B981',
    warning:         '#F59E0B',
    error:           '#EF4444',
    info:            '#0EA5E9',
    aws:             '#F59E0B',
  },
};

export type ColorScheme = keyof typeof Colors;
