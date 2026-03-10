/**
 * Theme store — accent color + dark mode.
 * Default accent aligns with refreshed blue/teal web theme.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AccentPreset =
  | 'purple' // legacy
  | 'teal'   // legacy
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
  purple:   { primary: '#6C5BFF', primaryLight: '#F0EDFF', primaryText: '#4C3BE4', primaryTextDark: '#BAAEFF', gradientFrom: '#6C5BFF', gradientTo: '#36E5F0', gradientAccent: '#A855F7', label: 'Neon Aurora',    emoji: '🌈' },
  teal:     { primary: '#0EA5E9', primaryLight: '#E0F7FF', primaryText: '#026AA2', primaryTextDark: '#38BDF8', gradientFrom: '#0EA5E9', gradientTo: '#2DD4BF', gradientAccent: '#60A5FA', label: 'Ocean Glass',    emoji: '🌊' },
  aurora:   { primary: '#6C5BFF', primaryLight: '#F0EDFF', primaryText: '#4C3BE4', primaryTextDark: '#BAAEFF', gradientFrom: '#6C5BFF', gradientTo: '#36E5F0', gradientAccent: '#A855F7', label: 'Neon Aurora',    emoji: '🌈' },
  ocean:    { primary: '#0EA5E9', primaryLight: '#E0F7FF', primaryText: '#026AA2', primaryTextDark: '#38BDF8', gradientFrom: '#0EA5E9', gradientTo: '#2DD4BF', gradientAccent: '#60A5FA', label: 'Ocean Glass',    emoji: '🌊' },
  forest:   { primary: '#10B981', primaryLight: '#DCFCE7', primaryText: '#047857', primaryTextDark: '#6EE7B7', gradientFrom: '#10B981', gradientTo: '#84CC16', gradientAccent: '#14B8A6', label: 'Forest Mint',    emoji: '🌿' },
  sunset:   { primary: '#F97316', primaryLight: '#FFEDD5', primaryText: '#C2410C', primaryTextDark: '#FDBA74', gradientFrom: '#F97316', gradientTo: '#FB7185', gradientAccent: '#F59E0B', label: 'Sunset Coral',   emoji: '🌇' },
  midnight: { primary: '#1D4ED8', primaryLight: '#DBEAFE', primaryText: '#1E3A8A', primaryTextDark: '#93C5FD', gradientFrom: '#1E3A8A', gradientTo: '#22D3EE', gradientAccent: '#0EA5E9', label: 'Midnight Cyan',  emoji: '🌌' },
  sand:     { primary: '#0F766E', primaryLight: '#CCFBF1', primaryText: '#115E59', primaryTextDark: '#5EEAD4', gradientFrom: '#F5E6D3', gradientTo: '#E6D2BF', gradientAccent: '#0EA5E9', label: 'Sandstone Calm', emoji: '🏜️' },
  slate:    { primary: '#475569', primaryLight: '#F1F5F9', primaryText: '#334155', primaryTextDark: '#CBD5E1', gradientFrom: '#94A3B8', gradientTo: '#CBD5E1', gradientAccent: '#64748B', label: 'Slate Minimal',  emoji: '🪨' },
  emerald:  { primary: '#10B981', primaryLight: '#D1F7E2', primaryText: '#065F46', primaryTextDark: '#6EE7A2', gradientFrom: '#10B981', gradientTo: '#84CC16', gradientAccent: '#14B8A6', label: 'Emerald',        emoji: '🟢' },
  amber:    { primary: '#F59E0B', primaryLight: '#FEF3C7', primaryText: '#92400E', primaryTextDark: '#FCD34D', gradientFrom: '#F59E0B', gradientTo: '#F97316', gradientAccent: '#FB7185', label: 'Amber',          emoji: '🟡' },
  rose:     { primary: '#EF4444', primaryLight: '#FCEAEA', primaryText: '#991B1B', primaryTextDark: '#FCA5A5', gradientFrom: '#EC4899', gradientTo: '#A78BFA', gradientAccent: '#F43F5E', label: 'Rose Quartz',   emoji: '🌸' },
  indigo:   { primary: '#4B5EFA', primaryLight: '#E8EAFF', primaryText: '#2B3ECC', primaryTextDark: '#A5B4FC', gradientFrom: '#4B5EFA', gradientTo: '#0EA5E9', gradientAccent: '#22D3EE', label: 'Deep Indigo',    emoji: '🔵' },
};

interface ThemeState {
  accent:       AccentPreset;
  darkMode:     boolean;
  setAccent:    (preset: AccentPreset) => void;
  toggleDark:   () => void;
  setDarkMode:  (value: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      accent:      'aurora',
      darkMode:    false,
      setAccent:   (accent)  => set({ accent }),
      toggleDark:  ()        => set((s) => ({ darkMode: !s.darkMode })),
      setDarkMode: (darkMode) => set({ darkMode }),
    }),
    {
      name:    'theme-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
