import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { LocationGeocodedAddress } from 'expo-location';

import { ENV } from '@/shared/config/env';

import { reverseGeocodeLocation } from './signup-map-geocode';

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

function coordinateFallbackLabel(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

const COORDINATE_LABEL_PATTERN = /^-?\d+\.\d{1,6},\s*-?\d+\.\d{1,6}$/;

export function isCoordinateLabel(label: string): boolean {
  return COORDINATE_LABEL_PATTERN.test(label.trim());
}

export async function resolveAddressLabel(latitude: number, longitude: number): Promise<string> {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const first = places[0];
    if (first) {
      const label = formatGeocodedAddressLabel(first);
      if (label) {
        return label;
      }
    }
  } catch {
    // Fall through to Google Geocoding API.
  }

  const googleLabel = await reverseGeocodeLocation(
    latitude,
    longitude,
    ENV.googleMapsApiKey,
  );
  if (googleLabel) {
    return googleLabel;
  }

  return coordinateFallbackLabel(latitude, longitude);
}
