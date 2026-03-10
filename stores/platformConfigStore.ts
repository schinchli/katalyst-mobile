import { create } from 'zustand';
import { DEFAULT_MOBILE_PLATFORM_CONFIG, normalizeMobilePlatformConfig, type MobilePlatformConfig } from '@/config/platformExperience';

interface PlatformConfigState {
  config: MobilePlatformConfig;
  hydrated: boolean;
  setConfig: (value: unknown) => void;
  updateConfig: (patch: Partial<MobilePlatformConfig>) => void;
  setHydrated: (value: boolean) => void;
}

export const usePlatformConfigStore = create<PlatformConfigState>((set) => ({
  config: DEFAULT_MOBILE_PLATFORM_CONFIG,
  hydrated: false,
  setConfig: (value) => set({ config: normalizeMobilePlatformConfig(value), hydrated: true }),
  updateConfig: (patch) =>
    set((state) => ({
      config: normalizeMobilePlatformConfig({
        ...state.config,
        ...patch,
        copy: { ...state.config.copy, ...(patch.copy ?? {}) },
        colors: { ...state.config.colors, ...(patch.colors ?? {}) },
        layout: { ...state.config.layout, ...(patch.layout ?? {}) },
        widgets: { ...state.config.widgets, ...(patch.widgets ?? {}) },
        theme: { ...state.config.theme, ...(patch.theme ?? {}) },
      }),
      hydrated: true,
    })),
  setHydrated: (value) => set({ hydrated: value }),
}));
