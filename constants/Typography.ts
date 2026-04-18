/**
 * Typography system — maps to Public Sans font weights.
 * Import and use `F.*` in StyleSheet fontFamily / fontWeight pairs.
 *
 * Usage:
 *   import { F } from '@/constants/Typography';
 *   style={{ fontFamily: F.regular, fontSize: 14 }}
 */

export const F = {
  regular:   'PublicSans-Regular',    // 400
  medium:    'PublicSans-Medium',     // 500
  semiBold:  'PublicSans-SemiBold',   // 600
  bold:      'PublicSans-Bold',       // 700
} as const;

/** Type scale (px → same in RN points on 1x) */
export const TS = {
  xxl:   { fontFamily: F.bold,     fontSize: 28 },   // large stat numbers
  xl:    { fontFamily: F.bold,     fontSize: 22 },   // screen-level headings
  lg:    { fontFamily: F.semiBold, fontSize: 18 },   // section headings
  md:    { fontFamily: F.semiBold, fontSize: 16 },   // card titles
  base:  { fontFamily: F.medium,   fontSize: 15 },   // primary body
  sm:    { fontFamily: F.regular,  fontSize: 14 },   // secondary body
  xs:    { fontFamily: F.medium,   fontSize: 12 },   // labels / captions
  xxs:   { fontFamily: F.regular,  fontSize: 11 },   // tiny labels
} as const;
