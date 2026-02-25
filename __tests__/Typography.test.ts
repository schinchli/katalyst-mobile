import { F, TS } from '@/constants/Typography';

describe('Typography constants', () => {
  describe('F (font families)', () => {
    it('has all four weights defined', () => {
      expect(F.regular).toBe('PublicSans-Regular');
      expect(F.medium).toBe('PublicSans-Medium');
      expect(F.semiBold).toBe('PublicSans-SemiBold');
      expect(F.bold).toBe('PublicSans-Bold');
    });
  });

  describe('TS (type scale)', () => {
    it('has type scale entries for all sizes', () => {
      const sizes = ['xxl', 'xl', 'lg', 'md', 'base', 'sm', 'xs', 'xxs'] as const;
      sizes.forEach((size) => {
        expect(TS[size]).toBeDefined();
        expect(typeof TS[size].fontSize).toBe('number');
        expect(typeof TS[size].fontFamily).toBe('string');
      });
    });

    it('type scale sizes are ordered largest to smallest', () => {
      expect(TS.xxl.fontSize).toBeGreaterThan(TS.xl.fontSize);
      expect(TS.xl.fontSize).toBeGreaterThan(TS.lg.fontSize);
      expect(TS.lg.fontSize).toBeGreaterThan(TS.md.fontSize);
      expect(TS.md.fontSize).toBeGreaterThan(TS.base.fontSize);
      expect(TS.base.fontSize).toBeGreaterThan(TS.sm.fontSize);
      expect(TS.sm.fontSize).toBeGreaterThan(TS.xs.fontSize);
      expect(TS.xs.fontSize).toBeGreaterThan(TS.xxs.fontSize);
    });
  });
});
