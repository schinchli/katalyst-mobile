/**
 * Theme store — accent color + dark mode.
 * Vuexy Purple is the default accent (parent theme).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AccentPreset =
  | 'purple'
  | 'teal'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'indigo';

export interface AccentConfig {
  primary:         string;
  primaryLight:    string;
  primaryText:     string;  // Accessible on light surface (WCAG AA)
  primaryTextDark: string;  // Accessible on dark surface (WCAG AA)
  label:           string;
  emoji:           string;
}

export const ACCENT_PRESETS: Record<AccentPreset, AccentConfig> = {
  purple:  { primary: '#7367F0', primaryLight: '#EBE9FD', primaryText: '#5E53E0', primaryTextDark: '#C4BFFF', label: 'Vuexy Purple', emoji: '🟣' },
  teal:    { primary: '#00BAD1', primaryLight: '#E0F9FC', primaryText: '#006070', primaryTextDark: '#67E8F9', label: 'Ocean Teal',   emoji: '🩵' },
  emerald: { primary: '#28C76F', primaryLight: '#D1F7E2', primaryText: '#0F6B35', primaryTextDark: '#6EE7A2', label: 'Emerald',      emoji: '🟢' },
  amber:   { primary: '#FF9F43', primaryLight: '#FFF3E8', primaryText: '#C05C10', primaryTextDark: '#FFD49A', label: 'Amber',        emoji: '🟡' },
  rose:    { primary: '#EA5455', primaryLight: '#FFE0E0', primaryText: '#B52D2E', primaryTextDark: '#FCA5A5', label: 'Rose',         emoji: '🔴' },
  indigo:  { primary: '#4B5EFA', primaryLight: '#E8EAFF', primaryText: '#2B3ECC', primaryTextDark: '#A5B4FC', label: 'Deep Indigo',  emoji: '🔵' },
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
      accent:      'purple',
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
