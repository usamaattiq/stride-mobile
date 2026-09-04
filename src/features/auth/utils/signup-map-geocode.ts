import { locationsApi } from '@/services/api/locationsApi';

export type MapSearchResult = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

export type GeocodeCityResult = {
  address: string;
  city: string | null;
  placeId: string | null;
  latitude: number;
  longitude: number;
};

function toGeocodeCityResult(
  location: Awaited<ReturnType<typeof locationsApi.geocode>>,
): GeocodeCityResult | null {
  if (!location) return null;
  return {
    address: location.address,
    city: location.city?.trim() || null,
    placeId: location.placeId?.trim() || null,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

/** @deprecated apiKey ignored — geocoding goes through stride-api `/locations/*`. */
export async function reverseGeocodeDetails(
  latitude: number,
  longitude: number,
  _apiKey?: string,
  language?: string,
): Promise<{ address: string; city: string | null; placeId: string | null } | null> {
  const mapped = await locationsApi.reverseGeocode({ lat: latitude, lng: longitude, language });
  if (!mapped) return null;
  return {
    address: mapped.address,
    city: mapped.city?.trim() || null,
    placeId: mapped.placeId?.trim() || null,
  };
}

/** @deprecated apiKey ignored — geocoding goes through stride-api `/locations/*`. */
export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
  _apiKey?: string,
  language?: string,
): Promise<string | null> {
  const details = await reverseGeocodeDetails(latitude, longitude, undefined, language);
  return details?.address ?? null;
}

/** @deprecated apiKey ignored — geocoding goes through stride-api `/locations/*`. */
export async function geocodePlaceId(
  placeId: string,
  _apiKey?: string,
  language?: string,
): Promise<GeocodeCityResult | null> {
  return toGeocodeCityResult(await locationsApi.geocode({ placeId, language }));
}

/** @deprecated apiKey ignored — geocoding goes through stride-api `/locations/*`. */
export async function geocodeAddress(
  address: string,
  _apiKey?: string,
  language?: string,
): Promise<GeocodeCityResult | null> {
  return toGeocodeCityResult(await locationsApi.geocode({ address, language }));
}

/** @deprecated apiKey ignored — geocoding goes through stride-api `/locations/*`. */
export async function searchMapLocations(
  query: string,
  _apiKey?: string,
  language?: string,
): Promise<MapSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return locationsApi.search({ q: trimmed, language });
}
