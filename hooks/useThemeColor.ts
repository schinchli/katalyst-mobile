import { Colors } from '@/constants/Colors';
import { useThemeStore, ACCENT_PRESETS } from '@/stores/themeStore';
import type { ThemeColors } from '@/constants/Colors';

export function useThemeColor(colorName: keyof ThemeColors): string {
  const accent   = useThemeStore((s) => s.accent);
  const darkMode = useThemeStore((s) => s.darkMode);
  const base     = Colors[darkMode ? 'dark' : 'light'];
  const preset   = ACCENT_PRESETS[accent];
  const surfaceOverrides = darkMode ? preset.darkOverrides : preset.lightOverrides;
  const overrides: Partial<ThemeColors> = {
    ...surfaceOverrides,
    primary:         preset.primary,
    primaryLight:    preset.primaryLight,
    primaryText:     darkMode ? preset.primaryTextDark : preset.primaryText,
    gradientFrom:    preset.gradientFrom,
    gradientTo:      preset.gradientTo,
    gradientAccent:  preset.gradientAccent,
    tint:            preset.primary,
    tabIconSelected: preset.primary,
  };
  return (overrides[colorName] ?? base[colorName]) as string;
}

export function useThemeColors(): ThemeColors {
  const accent   = useThemeStore((s) => s.accent);
  const darkMode = useThemeStore((s) => s.darkMode);
  const base     = Colors[darkMode ? 'dark' : 'light'];
  const preset   = ACCENT_PRESETS[accent];
  const surfaceOverrides = darkMode ? preset.darkOverrides : preset.lightOverrides;
  return {
    ...base,
    ...surfaceOverrides,
    primary:         preset.primary,
    primaryLight:    preset.primaryLight,
    primaryText:     darkMode ? preset.primaryTextDark : preset.primaryText,
    gradientFrom:    preset.gradientFrom,
    gradientTo:      preset.gradientTo,
    gradientAccent:  preset.gradientAccent,
    tint:            preset.primary,
    tabIconSelected: preset.primary,
  };
}

/** Always returns dark-mode colors regardless of the user's light/dark setting.
 *  Used on screens that must always have a dark background (quiz screen). */
export function useDarkThemeColors(): ThemeColors {
  const accent  = useThemeStore((s) => s.accent);
  const preset  = ACCENT_PRESETS[accent];
  const base    = Colors.dark;
  const surfaceOverrides = preset.darkOverrides ?? {};
  return {
    ...base,
    ...surfaceOverrides,
    primary:         preset.primary,
    primaryLight:    preset.primaryLight,
    primaryText:     preset.primaryTextDark,
    gradientFrom:    preset.gradientFrom,
    gradientTo:      preset.gradientTo,
    gradientAccent:  preset.gradientAccent,
    tint:            preset.primary,
    tabIconSelected: preset.primary,
  };
}
