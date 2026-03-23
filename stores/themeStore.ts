/**
 * Theme store — accent color + dark mode.
 * Default accent aligns with refreshed blue/teal web theme.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeColors } from '@/constants/Colors';

export type AccentPreset =
  | 'ocean'
  | 'aurora'
  | 'forest'
  | 'sunset'
  | 'midnight'
  | 'sand'
  | 'slate'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'indigo'
  | 'nocturnal'
  | 'cerulean'
  | 'violet'
  | 'ember'
  | 'royal'
  | 'spring';

export interface AccentConfig {
  primary:         string;
  primaryLight:    string;
  primaryText:     string;  // Accessible on light surface (WCAG AA)
  primaryTextDark: string;  // Accessible on dark surface (WCAG AA)
  gradientFrom:    string;
  gradientTo:      string;
  gradientAccent:  string;
  label:           string;
  emoji:           string;
  lightOverrides?: Partial<ThemeColors>;
  darkOverrides?: Partial<ThemeColors>;
}

export const THEME_PRESET_ORDER: AccentPreset[] = [
  'indigo',
  'aurora',
  'ocean',
  'forest',
  'sunset',
  'midnight',
  'sand',
  'slate',
  'emerald',
  'amber',
  'rose',
  'nocturnal',
  'cerulean',
  'violet',
  'ember',
  'royal',
  'spring',
];

export const ACCENT_PRESETS: Record<AccentPreset, AccentConfig> = {
  aurora:   { primary: '#0EA5E9', primaryLight: '#E6F4FF', primaryText: '#0369A1', primaryTextDark: '#7DD3FC', gradientFrom: '#C084FC', gradientTo: '#0EA5E9', gradientAccent: '#22D3EE', label: 'Neon Aurora',    emoji: '🌈' },
  ocean:    { primary: '#0EA5E9', primaryLight: '#E0F7FF', primaryText: '#026AA2', primaryTextDark: '#38BDF8', gradientFrom: '#0EA5E9', gradientTo: '#2DD4BF', gradientAccent: '#60A5FA', label: 'Ocean Glass',    emoji: '🌊' },
  forest:   { primary: '#10B981', primaryLight: '#DCFCE7', primaryText: '#047857', primaryTextDark: '#6EE7B7', gradientFrom: '#10B981', gradientTo: '#84CC16', gradientAccent: '#14B8A6', label: 'Forest Mint',    emoji: '🌿' },
  sunset:   { primary: '#F97316', primaryLight: '#FFEDD5', primaryText: '#C2410C', primaryTextDark: '#FDBA74', gradientFrom: '#F97316', gradientTo: '#FB7185', gradientAccent: '#F59E0B', label: 'Sunset Coral',   emoji: '🌇' },
  midnight: { primary: '#22D3EE', primaryLight: '#123043', primaryText: '#0E7490', primaryTextDark: '#67E8F9', gradientFrom: '#0F172A', gradientTo: '#1E293B', gradientAccent: '#22D3EE', label: 'Midnight Focus', emoji: '🌌' },
  sand:     { primary: '#0EA5E9', primaryLight: '#E6F8FF', primaryText: '#075985', primaryTextDark: '#67E8F9', gradientFrom: '#F5E6D3', gradientTo: '#E6D2BF', gradientAccent: '#0EA5E9', label: 'Sandstone Calm', emoji: '🏜️' },
  slate:    { primary: '#475569', primaryLight: '#F1F5F9', primaryText: '#334155', primaryTextDark: '#CBD5E1', gradientFrom: '#94A3B8', gradientTo: '#CBD5E1', gradientAccent: '#64748B', label: 'Slate Minimal',  emoji: '🪨' },
  emerald:  { primary: '#10B981', primaryLight: '#D1F7E2', primaryText: '#065F46', primaryTextDark: '#6EE7A2', gradientFrom: '#10B981', gradientTo: '#84CC16', gradientAccent: '#14B8A6', label: 'Emerald',        emoji: '🟢' },
  amber:    { primary: '#F59E0B', primaryLight: '#FEF3C7', primaryText: '#92400E', primaryTextDark: '#FCD34D', gradientFrom: '#F59E0B', gradientTo: '#F97316', gradientAccent: '#FB7185', label: 'Amber',          emoji: '🟡' },
  rose:     { primary: '#EF4444', primaryLight: '#FCEAEA', primaryText: '#991B1B', primaryTextDark: '#FCA5A5', gradientFrom: '#EC4899', gradientTo: '#A78BFA', gradientAccent: '#F43F5E', label: 'Rose Quartz',   emoji: '🌸' },
  indigo:   { primary: '#4B5EFA', primaryLight: '#E8EAFF', primaryText: '#2B3ECC', primaryTextDark: '#A5B4FC', gradientFrom: '#4B5EFA', gradientTo: '#0EA5E9', gradientAccent: '#22D3EE', label: 'Deep Indigo',    emoji: '🔵' },
  nocturnal:{ primary: '#FFC801', primaryLight: '#FFF4BF', primaryText: '#7D5D00', primaryTextDark: '#FFE06B', gradientFrom: '#FF9932', gradientTo: '#114C5A', gradientAccent: '#D9E8E2', label: 'Nocturnal Luxe', emoji: '🌙',
    lightOverrides: { text: '#172B36', textSecondary: '#47626C', textMuted: '#6E8891', background: '#F1F6F4', backgroundAlt: '#D9E8E2', surface: '#FFFFFF', surfaceElevated: '#F7FBF9', surfaceBorder: '#C7D8D2', tabIconDefault: '#6E8891' },
    darkOverrides:  { text: '#F1F6F4', textSecondary: '#C7DDD5', textMuted: '#7EA4AA', background: '#0E1F29', backgroundAlt: '#132A35', surface: '#172B36', surfaceElevated: '#1E3741', surfaceBorder: '#2B4A54', tabIconDefault: '#6D8A92' },
  },
  cerulean: { primary: '#2274A5', primaryLight: '#DCEAF4', primaryText: '#174D6D', primaryTextDark: '#9FD1F4', gradientFrom: '#E7DFC6', gradientTo: '#2274A5', gradientAccent: '#131B23', label: 'Cerulean Ink',   emoji: '🧿',
    lightOverrides: { text: '#131B23', textSecondary: '#5A6671', textMuted: '#748391', background: '#E7DFC6', backgroundAlt: '#E9F1F7', surface: '#F9F6EA', surfaceElevated: '#FFFFFF', surfaceBorder: '#D6D7D9', tabIconDefault: '#748391' },
    darkOverrides:  { text: '#F5F1E4', textSecondary: '#C9D7E3', textMuted: '#7B8D9E', background: '#10171E', backgroundAlt: '#131B23', surface: '#192632', surfaceElevated: '#1F2F3D', surfaceBorder: '#31485C', tabIconDefault: '#7B8D9E' },
  },
  violet:   { primary: '#D8E63C', primaryLight: '#F2F8B8', primaryText: '#6D7600', primaryTextDark: '#EAF391', gradientFrom: '#17184B', gradientTo: '#D6B4FC', gradientAccent: '#D3DDE7', label: 'Duranta Violet', emoji: '🪻',
    lightOverrides: { text: '#17184B', textSecondary: '#5A608F', textMuted: '#8F97B9', background: '#F0EEE9', backgroundAlt: '#D3DDE7', surface: '#FFFFFF', surfaceElevated: '#F7F4FB', surfaceBorder: '#D6DCE7', tabIconDefault: '#8F97B9' },
    darkOverrides:  { text: '#F0EEE9', textSecondary: '#CFC6F4', textMuted: '#8D90C3', background: '#11133A', backgroundAlt: '#17184B', surface: '#21205E', surfaceElevated: '#2B2A72', surfaceBorder: '#4C4AA0', tabIconDefault: '#8D90C3' },
  },
  ember:    { primary: '#FF6037', primaryLight: '#FFD7CB', primaryText: '#9C2F12', primaryTextDark: '#FFAA91', gradientFrom: '#A0C9CB', gradientTo: '#733635', gradientAccent: '#ECECDC', label: 'Ember Mist',     emoji: '🔥',
    lightOverrides: { text: '#351E1C', textSecondary: '#775351', textMuted: '#96706D', background: '#F5F4ED', backgroundAlt: '#ECECDC', surface: '#FFFFFF', surfaceElevated: '#F9F7F3', surfaceBorder: '#DDD5CC', tabIconDefault: '#96706D' },
    darkOverrides:  { text: '#F5F4ED', textSecondary: '#D2C4C1', textMuted: '#A78683', background: '#241715', backgroundAlt: '#351E1C', surface: '#4A2724', surfaceElevated: '#5A302B', surfaceBorder: '#733635', tabIconDefault: '#A78683' },
  },
  royal:    { primary: '#FFA102', primaryLight: '#FFE2B0', primaryText: '#8B5600', primaryTextDark: '#FFC75A', gradientFrom: '#432E6F', gradientTo: '#BC2D29', gradientAccent: '#DD5533', label: 'Royal Ember',    emoji: '👑',
    lightOverrides: { text: '#450E16', textSecondary: '#7E434C', textMuted: '#A56D75', background: '#F5F9CE', backgroundAlt: '#F6EFE0', surface: '#FFF8EE', surfaceElevated: '#FFFFFF', surfaceBorder: '#E6D6C3', tabIconDefault: '#A56D75' },
    darkOverrides:  { text: '#F8F1E8', textSecondary: '#D8BFC0', textMuted: '#A77D83', background: '#331017', backgroundAlt: '#450E16', surface: '#5B1A22', surfaceElevated: '#6D212A', surfaceBorder: '#8E352C', tabIconDefault: '#A77D83' },
  },
  spring:   { primary: '#DBE64C', primaryLight: '#F3F8B8', primaryText: '#6C7500', primaryTextDark: '#E7F07D', gradientFrom: '#00804C', gradientTo: '#1E488F', gradientAccent: '#74C365', label: 'Spring Mirage',  emoji: '🌱',
    lightOverrides: { text: '#001F3F', textSecondary: '#365D79', textMuted: '#6A8AA4', background: '#F6F7ED', backgroundAlt: '#E2EBD8', surface: '#FFFFFF', surfaceElevated: '#F8FCF6', surfaceBorder: '#D5E2CC', tabIconDefault: '#6A8AA4' },
    darkOverrides:  { text: '#F6F7ED', textSecondary: '#C9D7E6', textMuted: '#86A3BF', background: '#061933', backgroundAlt: '#001F3F', surface: '#0B2A4B', surfaceElevated: '#123764', surfaceBorder: '#1E488F', tabIconDefault: '#86A3BF' },
  },
};

export type FontSizePreset = 'small' | 'medium' | 'large';

// Best-practice scale ratios (Apple HIG + Material Design)
// Small  → 87.5% — readable but compact
// Medium → 100%  — default, matches platform norms
// Large  → 112.5% — accessible, comfortable for longer reading
export const FONT_SCALE: Record<FontSizePreset, number> = {
  small:  0.875,
  medium: 1.0,
  large:  1.125,
};

interface ThemeState {
  accent:              AccentPreset;
  darkMode:            boolean;
  usePlatform:         boolean;
  animationsEnabled:   boolean;
  fontSizePreset:      FontSizePreset;
  setAccent:           (preset: AccentPreset) => void;
  toggleDark:          () => void;
  setDarkMode:         (value: boolean) => void;
  setUsePlatform:      (value: boolean) => void;
  setAnimationsEnabled:(value: boolean) => void;
  setFontSizePreset:   (preset: FontSizePreset) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      accent:            'indigo',
      darkMode:          true,
      usePlatform:       true,
      animationsEnabled: true,
      fontSizePreset:    'medium',
      setAccent:           (accent)            => set({ accent }),
      toggleDark:          ()                  => set((s) => ({ darkMode: !s.darkMode })),
      setDarkMode:         (darkMode)          => set({ darkMode }),
      setUsePlatform:      (usePlatform)       => set({ usePlatform }),
      setAnimationsEnabled:(animationsEnabled) => set({ animationsEnabled }),
      setFontSizePreset:   (fontSizePreset)    => set({ fontSizePreset }),
    }),
    {
      name:    'theme-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      migrate: async (persisted) => {
        const state = persisted as ThemeState | undefined;
        if (!state) return { accent: 'indigo', darkMode: true, usePlatform: true, animationsEnabled: true, fontSizePreset: 'medium' } as ThemeState;
        const legacyMap: Record<string, AccentPreset> = { purple: 'aurora', teal: 'ocean', datacamp: 'indigo' };
        const nextAccent = legacyMap[state.accent as string] ?? state.accent ?? 'indigo';
        return { ...state, accent: nextAccent, darkMode: state.darkMode ?? true, usePlatform: state.usePlatform ?? true, animationsEnabled: state.animationsEnabled ?? true, fontSizePreset: state.fontSizePreset ?? 'medium' };
      },
    },
  ),
);
