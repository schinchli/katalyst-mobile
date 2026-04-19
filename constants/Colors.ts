/**
 * Design tokens — synchronized with web globals.css tokens.
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
    text:            '#2F2942',
    textSecondary:   '#6F6788',
    textMuted:       '#9A91B2',
    background:      '#FBF7FF',
    backgroundAlt:   '#F4EEFB',
    surface:         '#FFFFFF',
    surfaceElevated: '#FFFDFE',
    surfaceBorder:   '#E6DDF1',
    primary:         '#7C83FF',
    primaryLight:    '#ECEBFF',
    primaryText:     '#565BD7',
    gradientFrom:    '#A89BFF',
    gradientTo:      '#90D7F8',
    gradientAccent:  '#F3A6D6',
    tint:            '#7C83FF',
    tabIconDefault:  '#A49BB8',
    tabIconSelected: '#7C83FF',
    success:         '#65C8A5',
    warning:         '#F4B57A',
    error:           '#E9899C',
    info:            '#7C83FF',
    aws:             '#F4B57A',
  },

  dark: {
    text:            '#F5EEFF',
    textSecondary:   '#C2B8D8',
    textMuted:       '#968DAC',
    background:      '#171426',
    backgroundAlt:   '#211C35',
    surface:         '#29223F',
    surfaceElevated: '#332A4D',
    surfaceBorder:   '#463A66',
    primary:         '#A7A8FF',
    primaryLight:    'rgba(167,168,255,0.16)',
    primaryText:     '#CFCCFF',
    gradientFrom:    '#A7A8FF',
    gradientTo:      '#8FCBEA',
    gradientAccent:  '#F0A9D4',
    tint:            '#A7A8FF',
    tabIconDefault:  '#9B92B6',
    tabIconSelected: '#A7A8FF',
    success:         '#84D7B8',
    warning:         '#F1C28A',
    error:           '#F0A2B1',
    info:            '#A7A8FF',
    aws:             '#F1C28A',
  },
};

export type ColorScheme = keyof typeof Colors;
