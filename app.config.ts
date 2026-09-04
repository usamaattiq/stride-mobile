import type { ExpoConfig } from 'expo/config';
import appJson from './app.json';

const baseExpo = appJson.expo as ExpoConfig;

const legacyMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
const androidMapsKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID?.trim() || legacyMapsKey;
const iosMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS?.trim() || legacyMapsKey;

if (process.env.NODE_ENV === 'production' && !androidMapsKey && !iosMapsKey) {
  console.warn(
    '[app.config] Google Maps API keys are missing — set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID and EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS on EAS.',
  );
}

const config: ExpoConfig = {
  ...baseExpo,
  android: {
    ...baseExpo.android,
    config: {
      ...baseExpo.android?.config,
      googleMaps: { apiKey: androidMapsKey },
    },
  },
  ios: {
    ...baseExpo.ios,
    config: {
      ...baseExpo.ios?.config,
      googleMapsApiKey: iosMapsKey,
    },
  },
};

export default config;
