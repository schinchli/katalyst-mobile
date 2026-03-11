/**
 * Theme store — accent color + dark mode.
 * Default accent aligns with refreshed blue/teal web theme.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  | 'indigo';

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
}

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
};

interface ThemeState {
  accent:       AccentPreset;
  darkMode:     boolean;
  usePlatform:  boolean;
  setAccent:    (preset: AccentPreset) => void;
  toggleDark:   () => void;
  setDarkMode:  (value: boolean) => void;
  setUsePlatform: (value: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      accent:      'indigo',
      darkMode:    true,
      usePlatform: true,
      setAccent:   (accent)  => set({ accent }),
      toggleDark:  ()        => set((s) => ({ darkMode: !s.darkMode })),
      setDarkMode: (darkMode) => set({ darkMode }),
      setUsePlatform: (usePlatform) => set({ usePlatform }),
    }),
    {
      name:    'theme-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: async (persisted) => {
        const state = persisted as ThemeState | undefined;
        if (!state) return { accent: 'indigo', darkMode: true, usePlatform: true } as ThemeState;
        // Normalize legacy preset ids (purple → aurora, teal → ocean, datacamp → indigo)
        const legacyMap: Record<string, AccentPreset> = { purple: 'aurora', teal: 'ocean', datacamp: 'indigo' };
        const nextAccent = legacyMap[state.accent as string] ?? state.accent ?? 'indigo';
        return { ...state, accent: nextAccent, darkMode: state.darkMode ?? true, usePlatform: state.usePlatform ?? true };
      },
    },
  ),
);
