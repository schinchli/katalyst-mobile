import { useFontScale } from './useFontScale';

/**
 * Industry-standard typography tokens (Apple HIG + Material Design).
 * All sizes are base-medium values scaled by the user's font preference.
 *
 * Base (medium / 1.0×):          Small (0.875×):   Large (1.125×):
 *   screenTitle  24               21                27
 *   sectionTitle 17               15                19
 *   cardTitle    15               13                17
 *   body         14               12                16
 *   caption      12               11                14
 *   micro        11               10                12
 *
 * References:
 *   - Apple HIG: Large Title 34pt, Title 28pt, Body 17pt, Callout 16pt,
 *                Footnote 13pt, Caption 12pt
 *   - Material 3: Display→57px, Headline→32px, Title→22px,
 *                 Body Large→16px, Body Medium→14px, Label→12px
 *
 * We use compact sizes suitable for an information-dense learning app.
 */
export function useTypography() {
  const s = useFontScale();
  return {
    screenTitle:  Math.round(24 * s),
    sectionTitle: Math.round(17 * s),
    cardTitle:    Math.round(15 * s),
    body:         Math.round(14 * s),
    caption:      Math.round(12 * s),
    micro:        Math.round(11 * s),
  };
}
