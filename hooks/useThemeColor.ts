import { Colors } from '@/constants/Colors';
import { useThemeStore, ACCENT_PRESETS } from '@/stores/themeStore';
import type { ThemeColors } from '@/constants/Colors';

export function useThemeColor(colorName: keyof ThemeColors): string {
  const accent   = useThemeStore((s) => s.accent);
  const darkMode = useThemeStore((s) => s.darkMode);
  const base     = Colors[darkMode ? 'dark' : 'light'];
  const preset   = ACCENT_PRESETS[accent];
  const overrides: Partial<ThemeColors> = {
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
  return {
    ...base,
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
