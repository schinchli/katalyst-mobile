import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { AppConfig } from '@/config/appConfig';

// Show an interstitial ad every N questions during a quiz
export const INTERSTITIAL_AD_INTERVAL = 5;

const AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : (Platform.select({
      ios:     AppConfig.admob.ios.interstitialId,
      android: AppConfig.admob.android.interstitialId,
    }) || TestIds.INTERSTITIAL);

export function useInterstitialAd() {
  const adRef = useRef<InterstitialAd | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => setLoaded(true));
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      ad.load(); // preload next ad immediately after close
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => setLoaded(false));

    ad.load();

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
    };
  }, []);

  const showAd = () => {
    if (loaded && adRef.current) {
      adRef.current.show().catch(() => {
        // Ad failed to show (e.g. no fill), continue quiz silently
      });
    }
  };

  return { showAd };
}
