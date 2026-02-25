import { Platform, useWindowDimensions } from 'react-native';

/**
 * Responsive layout helpers for web.
 *
 * On desktop web (>= 768px):
 *   - Content is constrained to maxWidth 900px and centered
 *   - Padding is more generous
 *
 * On mobile / narrow web:
 *   - Default mobile behaviour (no constraints)
 */
export function useWebLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const isWide    = Platform.OS === 'web' && width >= 1280;

  /** Spread onto ScrollView contentContainerStyle to constrain width on desktop */
  const contentContainerWeb = isDesktop
    ? ({
        maxWidth:        900,
        alignSelf:       'center' as const,
        width:           '100%' as const,
        paddingHorizontal: isWide ? 40 : 28,
      } as const)
    : ({} as const);

  return { isDesktop, isWide, contentContainerWeb };
}
