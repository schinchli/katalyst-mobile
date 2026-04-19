/**
 * themeStore — unit tests
 * Tests the accent preset config without Zustand/AsyncStorage
 */
import { ACCENT_PRESETS, useThemeStore, THEME_PRESET_ORDER } from '@/stores/themeStore';
import type { AccentPreset } from '@/stores/themeStore';

const ALL_PRESETS: AccentPreset[] = THEME_PRESET_ORDER;

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

  it('default indigo preset has correct primary', () => {
    expect(ACCENT_PRESETS.indigo.primary).toBe('#7C83FF');
  });

  it('primary and primaryLight are different colors', () => {
    ALL_PRESETS.forEach((key) => {
      expect(ACCENT_PRESETS[key].primary).not.toBe(ACCENT_PRESETS[key].primaryLight);
    });
  });

  it('luxury palettes expose surface overrides for full-screen skins', () => {
    ['nocturnal', 'cerulean', 'violet', 'ember', 'royal', 'spring'].forEach((key) => {
      expect(ACCENT_PRESETS[key as AccentPreset].darkOverrides?.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(ACCENT_PRESETS[key as AccentPreset].lightOverrides?.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
