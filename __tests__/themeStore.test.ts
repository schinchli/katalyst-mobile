/**
 * themeStore — unit tests
 * Tests the accent preset config without Zustand/AsyncStorage
 */
import { ACCENT_PRESETS, useThemeStore } from '@/stores/themeStore';
import type { AccentPreset } from '@/stores/themeStore';

const ALL_PRESETS: AccentPreset[] = ['purple', 'teal', 'emerald', 'amber', 'rose', 'indigo'];

describe('ACCENT_PRESETS — structure', () => {
  it('has an entry for every accent preset key', () => {
    ALL_PRESETS.forEach((key) => {
      expect(ACCENT_PRESETS[key]).toBeDefined();
    });
  });

  it('every preset has a valid hex primary color', () => {
    ALL_PRESETS.forEach((key) => {
      expect(ACCENT_PRESETS[key].primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('every preset has a valid hex primaryLight color', () => {
    ALL_PRESETS.forEach((key) => {
      expect(ACCENT_PRESETS[key].primaryLight).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('every preset has a non-empty label', () => {
    ALL_PRESETS.forEach((key) => {
      expect(ACCENT_PRESETS[key].label.length).toBeGreaterThan(0);
    });
  });

  it('every preset has an emoji', () => {
    ALL_PRESETS.forEach((key) => {
      expect(ACCENT_PRESETS[key].emoji.length).toBeGreaterThan(0);
    });
  });

  it('default purple preset matches Vuexy primary', () => {
    expect(ACCENT_PRESETS.purple.primary).toBe('#7367F0');
    expect(ACCENT_PRESETS.purple.primaryLight).toBe('#EBE9FD');
  });

  it('primary and primaryLight are different colors', () => {
    ALL_PRESETS.forEach((key) => {
      expect(ACCENT_PRESETS[key].primary).not.toBe(ACCENT_PRESETS[key].primaryLight);
    });
  });
});
