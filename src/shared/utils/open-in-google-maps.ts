import { Linking } from 'react-native';

type MapLocation = {
  latitude: number;
  longitude: number;
  label?: string | null;
};

/**
 * Opens a location in the Google Maps app when available (HTTPS deep link),
 * otherwise falls back to the browser.
 */
export async function openInGoogleMaps(location: MapLocation): Promise<void> {
  const { latitude, longitude } = location;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return;
  }

  const query = encodeURIComponent(`${latitude},${longitude}`);
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;

  await Linking.openURL(url);
}
