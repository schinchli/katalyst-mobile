import { useThemeStore, FONT_SCALE } from '@/stores/themeStore';

/** Returns a multiplier (0.85 / 1.0 / 1.18) based on the user's font size preference. */
export function useFontScale(): number {
  const preset = useThemeStore((s) => s.fontSizePreset);
  return FONT_SCALE[preset];
}

/** Returns a scaled font size rounded to the nearest integer. */
export function useScaledFont(base: number): number {
  const scale = useFontScale();
  return Math.round(base * scale);
}
