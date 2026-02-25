// Web stub — Google AdMob is not available on web.
// Metro will use useInterstitialAd.native.ts on iOS/Android automatically.
export const INTERSTITIAL_AD_INTERVAL = 5;

export function useInterstitialAd() {
  return { showAd: () => {} };
}
