import { EXPERIENCE_COPY } from '@/config/experience';
import type { AccentPreset } from '@/stores/themeStore';

export const MOBILE_PLATFORM_CONFIG_KEY = 'mobile_experience_config';

export interface MobilePlatformConfig {
  copy: {
    authHeadline: string;
    authSubheadline: string;
    homeHeroTitle: string;
    homeHeroSubtitle: string;
    premiumHeadline: string;
    premiumSubheadline: string;
    profileOfferTitle: string;
    profileOfferSubtitle: string;
    resourcesTitle: string;
    resourcesFilter: string;
  };
  colors: {
    homeHeroCourseBg: string;
    premiumAccent: string;
    resourcesBackground: string;
    profileOfferAccent: string;
  };
  layout: {
    homeActionsStyle: 'grid' | 'stack';
    courseCardColumns: 1 | 2;
    resourcesCardStyle: 'editorial' | 'compact';
    resourcesArticleCount: number;
  };
  widgets: {
    showHomeStats: boolean;
    showHomeActions: boolean;
    showPopularCourses: boolean;
    showFlashcards: boolean;
    showGrowthWidget: boolean;
  };
  theme: {
    platformAccent: AccentPreset;
  };
}

export const DEFAULT_MOBILE_PLATFORM_CONFIG: MobilePlatformConfig = {
  copy: {
    authHeadline: EXPERIENCE_COPY.auth.headline,
    authSubheadline: EXPERIENCE_COPY.auth.subheadline,
    homeHeroTitle: EXPERIENCE_COPY.home.heroTitle,
    homeHeroSubtitle: EXPERIENCE_COPY.home.heroSubtitle,
    premiumHeadline: EXPERIENCE_COPY.premium.headline,
    premiumSubheadline: EXPERIENCE_COPY.premium.subheadline,
    profileOfferTitle: EXPERIENCE_COPY.profile.offerTitle,
    profileOfferSubtitle: EXPERIENCE_COPY.profile.offerSubtitle,
    resourcesTitle: EXPERIENCE_COPY.resources.title,
    resourcesFilter: EXPERIENCE_COPY.resources.filter,
  },
  colors: {
    homeHeroCourseBg: '#0E1830',
    premiumAccent: '#8B5CF6',
    resourcesBackground: '#ECEFF4',
    profileOfferAccent: '#00ED64',
  },
  layout: {
    homeActionsStyle: 'grid',
    courseCardColumns: 2,
    resourcesCardStyle: 'editorial',
    resourcesArticleCount: 5,
  },
  widgets: {
    showHomeStats: true,
    showHomeActions: true,
    showPopularCourses: true,
    showFlashcards: true,
    showGrowthWidget: true,
  },
  theme: {
    platformAccent: 'indigo',
  },
};

export function normalizeMobilePlatformConfig(value: unknown): MobilePlatformConfig {
  const raw = (value ?? {}) as Partial<MobilePlatformConfig>;
  return {
    copy: {
      ...DEFAULT_MOBILE_PLATFORM_CONFIG.copy,
      ...(raw.copy ?? {}),
    },
    colors: {
      ...DEFAULT_MOBILE_PLATFORM_CONFIG.colors,
      ...(raw.colors ?? {}),
    },
    layout: {
      ...DEFAULT_MOBILE_PLATFORM_CONFIG.layout,
      ...(raw.layout ?? {}),
    },
    widgets: {
      ...DEFAULT_MOBILE_PLATFORM_CONFIG.widgets,
      ...(raw.widgets ?? {}),
    },
    theme: {
      ...DEFAULT_MOBILE_PLATFORM_CONFIG.theme,
      ...(raw.theme ?? {}),
    },
  };
}
