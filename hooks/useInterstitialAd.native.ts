import Constants from 'expo-constants';

// Stubbed for Expo Go — AdMob requires a custom dev client.
export const INTERSTITIAL_AD_INTERVAL = 5;
export function useInterstitialAd() {
  const isExpoGo = Constants.appOwnership === 'expo';
  const shouldShowAd = !isExpoGo;
  const showAd = async () => {
    if (isExpoGo) return;
    // TODO: integrate native interstitial SDK for release/dev client builds.
    return;
  };
  return { showAd, shouldShowAd };
}
