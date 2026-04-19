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
  'indigo',    // Pastel Indigo — default
  'forest',    // Soft Mint
  'aurora',    // Sky Lilac
  'sunset',    // Peach Bloom
  'violet',    // Lavender Bloom
  'nocturnal', // Twilight Mauve
];

export const ACCENT_PRESETS: Record<AccentPreset, AccentConfig> = {
  aurora:   { primary: '#7DB7F7', primaryLight: '#EAF4FF', primaryText: '#4578B8', primaryTextDark: '#B6DAFF', gradientFrom: '#D7B8FF', gradientTo: '#92D7F8', gradientAccent: '#F2B5E2', label: 'Sky Lilac',      emoji: '🌈' },
  ocean:    { primary: '#76C8D6', primaryLight: '#E6F8FB', primaryText: '#3E8895', primaryTextDark: '#A9E6EF', gradientFrom: '#93D6E4', gradientTo: '#9BE2CF', gradientAccent: '#A6B8FF', label: 'Sea Glass',      emoji: '🌊' },
  forest:   { primary: '#8BCFAF', primaryLight: '#ECF9F2', primaryText: '#4F8E73', primaryTextDark: '#BFEAD6', gradientFrom: '#B7E6C8', gradientTo: '#A8D8B4', gradientAccent: '#A9DCCF', label: 'Soft Mint',      emoji: '🌿' },
  sunset:   { primary: '#F2A48F', primaryLight: '#FFF0EA', primaryText: '#B86C59', primaryTextDark: '#FFC2B1', gradientFrom: '#F8C2AF', gradientTo: '#F6D8A8', gradientAccent: '#F2B7C6', label: 'Peach Bloom',    emoji: '🌇' },
  midnight: { primary: '#8FCBEA', primaryLight: '#1E3246', primaryText: '#467DA1', primaryTextDark: '#B6E2F7', gradientFrom: '#27344A', gradientTo: '#433A63', gradientAccent: '#A7A8FF', label: 'Velvet Night',   emoji: '🌌' },
  sand:     { primary: '#CDAE84', primaryLight: '#FAF1E7', primaryText: '#8A6A46', primaryTextDark: '#EACDA7', gradientFrom: '#F3E2CA', gradientTo: '#EFD5BB', gradientAccent: '#D8C5F3', label: 'Apricot Sand',   emoji: '🏜️' },
  slate:    { primary: '#9B9EB9', primaryLight: '#F1F2F8', primaryText: '#636982', primaryTextDark: '#CFD3E7', gradientFrom: '#CACEE0', gradientTo: '#E4E7F0', gradientAccent: '#B9C4F5', label: 'Misted Slate',   emoji: '🪨' },
  emerald:  { primary: '#7ECFAE', primaryLight: '#E5F8EF', primaryText: '#47866B', primaryTextDark: '#B9EBD7', gradientFrom: '#A9E3C8', gradientTo: '#CBEAB2', gradientAccent: '#A4D6C5', label: 'Mint Meadow',    emoji: '🟢' },
  amber:    { primary: '#F0BE7A', primaryLight: '#FFF5E6', primaryText: '#AD7A34', primaryTextDark: '#F8D8A4', gradientFrom: '#F8D3A2', gradientTo: '#F6B98D', gradientAccent: '#F4CDC0', label: 'Honey Glow',     emoji: '🟡' },
  rose:     { primary: '#E9A1BF', primaryLight: '#FDECF4', primaryText: '#AE6884', primaryTextDark: '#F7C7D9', gradientFrom: '#F2BDD0', gradientTo: '#D7C0FA', gradientAccent: '#F3B2C3', label: 'Rose Petal',     emoji: '🌸' },
  indigo:   { primary: '#7C83FF', primaryLight: '#ECEBFF', primaryText: '#565BD7', primaryTextDark: '#CFCCFF', gradientFrom: '#B0A6FF', gradientTo: '#93D5F6', gradientAccent: '#F0A6D2', label: 'Pastel Indigo',  emoji: '🔵' },
  nocturnal:{ primary: '#D5A8E8', primaryLight: '#F6EAFB', primaryText: '#8C5EA5', primaryTextDark: '#E9C8F5', gradientFrom: '#F0C2D8', gradientTo: '#8B88C9', gradientAccent: '#D6C4F1', label: 'Twilight Mauve', emoji: '🌙',
    lightOverrides: { text: '#3A3050', textSecondary: '#7E7097', textMuted: '#A092BA', background: '#FCF7FE', backgroundAlt: '#F2E9F7', surface: '#FFFFFF', surfaceElevated: '#FFFDFE', surfaceBorder: '#E9DDF2', tabIconDefault: '#A092BA' },
    darkOverrides:  { text: '#F7EEFF', textSecondary: '#D0C0E0', textMuted: '#A391BA', background: '#1D1830', backgroundAlt: '#292141', surface: '#33294D', surfaceElevated: '#3D325A', surfaceBorder: '#544370', tabIconDefault: '#A391BA' },
  },
  cerulean: { primary: '#7FAFD8', primaryLight: '#E8F0F8', primaryText: '#507799', primaryTextDark: '#BDD7EE', gradientFrom: '#F1E6D8', gradientTo: '#A9CBE7', gradientAccent: '#CFD4EA', label: 'Cerulean Mist',  emoji: '🧿',
    lightOverrides: { text: '#2F3243', textSecondary: '#747B92', textMuted: '#9AA2B5', background: '#FBF7F1', backgroundAlt: '#EEF3F9', surface: '#FFFFFF', surfaceElevated: '#FFFDFC', surfaceBorder: '#E3E2E6', tabIconDefault: '#9AA2B5' },
    darkOverrides:  { text: '#F4EFF6', textSecondary: '#C9D1E0', textMuted: '#9AA8BE', background: '#171B25', backgroundAlt: '#202736', surface: '#2A3346', surfaceElevated: '#334058', surfaceBorder: '#485674', tabIconDefault: '#9AA8BE' },
  },
  violet:   { primary: '#B99AF6', primaryLight: '#F2ECFF', primaryText: '#7A62B6', primaryTextDark: '#DCCAFB', gradientFrom: '#DCC6FB', gradientTo: '#F2B9D8', gradientAccent: '#C7D7F5', label: 'Lavender Bloom', emoji: '🪻',
    lightOverrides: { text: '#352E4E', textSecondary: '#7C7095', textMuted: '#A196B8', background: '#FBF7FE', backgroundAlt: '#EFE7FA', surface: '#FFFFFF', surfaceElevated: '#FEFBFF', surfaceBorder: '#E5DCF2', tabIconDefault: '#A196B8' },
    darkOverrides:  { text: '#F8F0FF', textSecondary: '#D6C8EB', textMuted: '#AA99C4', background: '#1E1831', backgroundAlt: '#2A2141', surface: '#342750', surfaceElevated: '#403061', surfaceBorder: '#584475', tabIconDefault: '#AA99C4' },
  },
  ember:    { primary: '#E79A87', primaryLight: '#FDEAE5', primaryText: '#A66250', primaryTextDark: '#F5C2B4', gradientFrom: '#C6E1E4', gradientTo: '#B98685', gradientAccent: '#EFEBDD', label: 'Blush Ember',    emoji: '🔥',
    lightOverrides: { text: '#46302D', textSecondary: '#866965', textMuted: '#A48A85', background: '#FCF8F4', backgroundAlt: '#F5EDE8', surface: '#FFFFFF', surfaceElevated: '#FFFDFC', surfaceBorder: '#E8DDD6', tabIconDefault: '#A48A85' },
    darkOverrides:  { text: '#FCF4F1', textSecondary: '#D8C6C1', textMuted: '#B19793', background: '#271B1A', backgroundAlt: '#352423', surface: '#47302E', surfaceElevated: '#553836', surfaceBorder: '#6E4C48', tabIconDefault: '#B19793' },
  },
  royal:    { primary: '#E3B06F', primaryLight: '#FCEFD9', primaryText: '#9E6D34', primaryTextDark: '#F2D1A3', gradientFrom: '#AA9CD8', gradientTo: '#E79D97', gradientAccent: '#E7B78B', label: 'Royal Blush',    emoji: '👑',
    lightOverrides: { text: '#48313F', textSecondary: '#856876', textMuted: '#A18996', background: '#FFF9EF', backgroundAlt: '#F9EEE7', surface: '#FFFFFF', surfaceElevated: '#FFFDFA', surfaceBorder: '#EBDCCE', tabIconDefault: '#A18996' },
    darkOverrides:  { text: '#FCF3EC', textSecondary: '#D8C3C7', textMuted: '#AE9198', background: '#2F1D28', backgroundAlt: '#3D2532', surface: '#52303F', surfaceElevated: '#613847', surfaceBorder: '#7B4C58', tabIconDefault: '#AE9198' },
  },
  spring:   { primary: '#BFD879', primaryLight: '#F4F9E4', primaryText: '#7D9550', primaryTextDark: '#DDEAAD', gradientFrom: '#BFE5B7', gradientTo: '#A8C7F0', gradientAccent: '#D4E6A4', label: 'Spring Haze',    emoji: '🌱',
    lightOverrides: { text: '#304149', textSecondary: '#6E828B', textMuted: '#96A7AD', background: '#F9FBF1', backgroundAlt: '#EDF4E4', surface: '#FFFFFF', surfaceElevated: '#FCFFFA', surfaceBorder: '#DFE8D5', tabIconDefault: '#96A7AD' },
    darkOverrides:  { text: '#F6F8EF', textSecondary: '#C9D4D5', textMuted: '#98A9AD', background: '#1B252B', backgroundAlt: '#243139', surface: '#304148', surfaceElevated: '#3A4D55', surfaceBorder: '#536A73', tabIconDefault: '#98A9AD' },
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
      darkMode:          false,
      usePlatform:       true,
      animationsEnabled: false,
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
        if (!state) return { accent: 'indigo', darkMode: false, usePlatform: true, animationsEnabled: false, fontSizePreset: 'medium' } as ThemeState;
        const legacyMap: Record<string, AccentPreset> = { purple: 'aurora', teal: 'ocean', datacamp: 'indigo' };
        const nextAccent = legacyMap[state.accent as string] ?? state.accent ?? 'indigo';
        return { ...state, accent: nextAccent, darkMode: state.darkMode ?? false, usePlatform: state.usePlatform ?? true, animationsEnabled: state.animationsEnabled ?? false, fontSizePreset: state.fontSizePreset ?? 'medium' };
      },
    },
  ),
);
