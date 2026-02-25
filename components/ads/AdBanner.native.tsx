import React from 'react';
import { View, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { AppConfig } from '@/config/appConfig';

const AD_UNIT_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : (Platform.select({
      ios:     AppConfig.admob.ios.bannerId,
      android: AppConfig.admob.android.bannerId,
    }) || TestIds.ADAPTIVE_BANNER);

interface AdBannerProps {
  style?: object;
}

export function AdBanner({ style }: AdBannerProps) {
  return (
    <View style={[{ width: '100%', alignItems: 'center', marginVertical: 8 }, style]}>
      <BannerAd
        unitId={AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}
