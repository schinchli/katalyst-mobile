import { Platform, useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

/** On web we lock to light mode to match the Vuexy design system. */
function useScheme() {
  const system = useColorScheme() ?? 'light';
  return Platform.OS === 'web' ? 'light' : system;
}

export function useThemeColor(colorName: keyof typeof Colors.light) {
  return Colors[useScheme()][colorName];
}

export function useThemeColors() {
  return Colors[useScheme()];
}
