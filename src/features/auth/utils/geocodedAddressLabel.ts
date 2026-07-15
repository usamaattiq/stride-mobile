import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { LocationGeocodedAddress } from 'expo-location';

function normalizeLocationSegment(segment: string): string {
  return segment.trim().toLowerCase().replace(/\s+/g, ' ');
}

function pushUniqueLocationPart(parts: string[], raw: string | null | undefined): void {
  if (!raw) return;
  const trimmed = raw.trim();
  if (!trimmed) return;
  const key = normalizeLocationSegment(trimmed);
  if (!key) return;
  if (parts.some((part) => normalizeLocationSegment(part) === key)) return;
  parts.push(trimmed);
}

export function formatGeocodedAddressLabel(address: LocationGeocodedAddress): string {
  const parts: string[] = [];

  if (Platform.OS === 'android' && address.formattedAddress) {
    const segments = address.formattedAddress
      .split(',')
      .map((segment) => segment.trim())
      .filter(Boolean);
    for (const segment of segments) {
      pushUniqueLocationPart(parts, segment);
    }
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }

  const streetLine = [address.streetNumber, address.street].filter(Boolean).join(' ').trim();

  pushUniqueLocationPart(parts, address.name);
  if (streetLine) pushUniqueLocationPart(parts, streetLine);
  pushUniqueLocationPart(parts, address.district);
  pushUniqueLocationPart(parts, address.subregion);
  pushUniqueLocationPart(parts, address.city);
  pushUniqueLocationPart(parts, address.region);
  pushUniqueLocationPart(parts, address.postalCode);
  pushUniqueLocationPart(parts, address.country);

  return parts.join(', ');
}

export async function resolveAddressLabel(latitude: number, longitude: number): Promise<string> {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const first = places[0];
    if (!first) return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    const label = formatGeocodedAddressLabel(first);
    return label || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  } catch {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }
}
