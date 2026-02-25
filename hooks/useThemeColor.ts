import { Colors } from '@/constants/Colors';

/** App is locked to light mode — Vuexy design system. */
function useScheme() {
  return 'light' as const;
}

export function useThemeColor(colorName: keyof typeof Colors.light) {
  return Colors[useScheme()][colorName];
}

export function useThemeColors() {
  return Colors[useScheme()];
}
