import * as Location from 'expo-location';

/**
 * Check-then-request pattern (avoids the Android permission hang from
 * requesting cold every time). Safe to call from anywhere, any number of
 * times — expo-location no-ops a request once permission is already decided.
 */
export async function ensureLocationPermission(): Promise<boolean> {
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.status === Location.PermissionStatus.GRANTED) {
    return true;
  }
  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.status === Location.PermissionStatus.GRANTED;
}
