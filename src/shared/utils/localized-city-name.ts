import {
  geocodeAddress,
  geocodePlaceId,
  reverseGeocodeDetails,
} from '@/features/auth/utils/signup-map-geocode';
import type { TripCity } from '@/features/dashboard/types/trip.types';

import { cityDisplayName } from './city-display-name';

export function isGooglePlaceId(id: string | null | undefined): boolean {
  if (!id) {
    return false;
  }
  if (id.startsWith('pk-') || id.startsWith('geo:')) {
    return false;
  }
  return id.length >= 16 && !id.includes(':');
}

export function citiesReferToSamePlace(left: TripCity, right: TripCity): boolean {
  if (left.id && right.id && left.id === right.id) {
    return true;
  }
  return (
    cityDisplayName(left.label).toLowerCase() === cityDisplayName(right.label).toLowerCase()
  );
}

type ResolveCityInput = {
  city: TripCity;
  latitude?: number | null;
  longitude?: number | null;
  language: string;
  apiKey: string;
};

const nameCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

function cacheKey(input: ResolveCityInput): string {
  if (isGooglePlaceId(input.city.id)) {
    return `place:${input.city.id}|${input.language}`;
  }
  if (input.latitude != null && input.longitude != null) {
    return `geo:${input.latitude.toFixed(3)},${input.longitude.toFixed(3)}|${input.language}`;
  }
  return `label:${cityDisplayName(input.city.label).toLowerCase()}|${input.language}`;
}

async function lookupLocalizedCityName(input: ResolveCityInput): Promise<string> {
  const fallback = cityDisplayName(input.city.label);
  if (!input.apiKey) {
    return fallback;
  }

  if (isGooglePlaceId(input.city.id)) {
    const byPlace = await geocodePlaceId(input.city.id, input.apiKey, input.language);
    const fromPlace = byPlace?.city?.trim() || cityDisplayName(byPlace?.address ?? '');
    if (fromPlace) {
      return fromPlace;
    }
  }

  if (input.latitude != null && input.longitude != null) {
    const byCoords = await reverseGeocodeDetails(
      input.latitude,
      input.longitude,
      input.apiKey,
      input.language,
    );
    const fromCoords = byCoords?.city?.trim() || cityDisplayName(byCoords?.address ?? '');
    if (fromCoords) {
      return fromCoords;
    }
  }

  const byAddress = await geocodeAddress(fallback, input.apiKey, input.language);
  return byAddress?.city?.trim() || cityDisplayName(byAddress?.address ?? '') || fallback;
}

export async function resolveLocalizedCityName(input: ResolveCityInput): Promise<string> {
  const fallback = cityDisplayName(input.city.label);
  const key = cacheKey(input);
  const cached = nameCache.get(key);
  if (cached) {
    return cached;
  }

  const pending = inflight.get(key);
  if (pending) {
    return pending;
  }

  const request = lookupLocalizedCityName(input)
    .then((name) => {
      const resolved = name.trim() || fallback;
      nameCache.set(key, resolved);
      return resolved;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
}

/** Attach a Google place_id and a language-aware city label when the picker only has a local id. */
export async function enrichSelectedCity(
  city: TripCity,
  language: string,
  apiKey: string,
): Promise<TripCity> {
  const fallbackLabel = cityDisplayName(city.label);
  if (!apiKey) {
    return { ...city, label: fallbackLabel };
  }

  if (isGooglePlaceId(city.id)) {
    const localized = await resolveLocalizedCityName({
      city,
      language,
      apiKey,
    });
    return { id: city.id, label: localized || fallbackLabel };
  }

  const geocoded = await geocodeAddress(fallbackLabel, apiKey, language);
  if (!geocoded?.placeId) {
    return { ...city, label: fallbackLabel };
  }

  const localized =
    geocoded.city?.trim() || cityDisplayName(geocoded.address) || fallbackLabel;
  nameCache.set(`place:${geocoded.placeId}|${language}`, localized);
  return { id: geocoded.placeId, label: localized };
}

export async function toBrowseCityParams(
  city: TripCity | null | undefined,
  apiKey: string,
): Promise<{ id?: string; label?: string }> {
  if (!city) {
    return {};
  }
  const englishName = await resolveLocalizedCityName({
    city,
    language: 'en',
    apiKey,
  });
  return {
    id: isGooglePlaceId(city.id) ? city.id : undefined,
    label: englishName || cityDisplayName(city.label),
  };
}
