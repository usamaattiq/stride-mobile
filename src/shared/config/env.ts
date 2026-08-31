/**
 * Public env vars (EXPO_PUBLIC_*). Inlined at bundle time — restart Expo after changing `.env`.
 * The map picker needs a Google Maps JavaScript API + Geocoding API key; without it the picker
 * shows a fallback message (current-location still works via expo-location).
 */
export const ENV = {
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '',
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
