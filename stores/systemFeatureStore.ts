import { create } from 'zustand';
import { DEFAULT_SYSTEM_FEATURES, normalizeSystemFeatures, type SystemFeaturesConfig } from '@/config/systemFeatures';

interface SystemFeatureState {
  config: SystemFeaturesConfig;
  hydrated: boolean;
  setConfig: (value: unknown) => void;
}

export const useSystemFeatureStore = create<SystemFeatureState>((set) => ({
  config: DEFAULT_SYSTEM_FEATURES,
  hydrated: false,
  setConfig: (value) => set({ config: normalizeSystemFeatures(value), hydrated: true }),
}));
