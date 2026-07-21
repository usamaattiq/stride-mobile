/**
 * Public env vars (EXPO_PUBLIC_*). Inlined at bundle time — restart Expo after changing `.env`.
 * The map picker needs a Google Maps JavaScript API + Geocoding API key; without it the picker
 * shows a fallback message (current-location still works via expo-location).
 */
export const ENV = {
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? '',
} as const;

export const hasGoogleMapsApiKey = (): boolean => ENV.googleMapsApiKey.length > 0;
