import { Platform } from 'react-native';

/**
 * Public env vars (EXPO_PUBLIC_*). Inlined at bundle time — restart Expo after changing `.env`.
 *
 * IMPORTANT: use direct `process.env.EXPO_PUBLIC_*` access (not dynamic keys) so Metro/EAS
 * can inline values into release builds.
 *
 * Google Maps keys must NOT be committed. Set locally in `.env` and on EAS Environment
 * Variables as EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID / _IOS.
 * Native MapView reads the same keys from app.config.ts (android.config.googleMaps /
 * ios.config.googleMapsApiKey). Places / Geocoding go through stride-api `/locations/*`
 * with GOOGLE_MAPS_SERVER_API_KEY — do not call maps.googleapis.com from the app.
 */
const EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID?.trim() || '';
const EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS?.trim() || '';
const EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';

/** Platform-appropriate Maps key (Android/iOS vars with legacy single-key fallback). */
export function getGoogleMapsApiKey(platform: typeof Platform.OS = Platform.OS): string {
  if (platform === 'android') {
    return EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID || EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  }
  if (platform === 'ios') {
    return EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS || EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  }
  return (
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID ||
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS
  );
}

export const ENV = {
  googleMapsApiKey: getGoogleMapsApiKey(),
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '',
  /** Hosted stride-compliance origin, no trailing slash (e.g. https://compliance.stride.ai). */
  complianceBaseUrl: process.env.EXPO_PUBLIC_COMPLIANCE_BASE_URL?.trim() ?? '',
  /** Must match stride-api `TRIP_CREATE_CREDITS`. */
  tripCreateCredits: Number.parseInt(
    process.env.EXPO_PUBLIC_TRIP_CREATE_CREDITS?.trim() || '10',
    10,
  ) || 10,
  bidOfferCredits: Number.parseInt(
    process.env.EXPO_PUBLIC_BID_OFFER_CREDITS?.trim() || '5',
    10,
  ) || 5,
} as const;

export const hasGoogleMapsApiKey = (): boolean => ENV.googleMapsApiKey.length > 0;
