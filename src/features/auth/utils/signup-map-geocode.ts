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

type GeocodeApiResponse = {
  status: string;
  results?: Array<{
    place_id?: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    address_components?: Array<{
      long_name: string;
      types: string[];
    }>;
  }>;
};

function cityNameFromComponents(
  components: Array<{ long_name: string; types: string[] }> | undefined,
): string | null {
  if (!components?.length) {
    return null;
  }
  const pick = (type: string) =>
    components.find((component) => component.types.includes(type))?.long_name?.trim();
  return (
    pick('locality') ||
    pick('postal_town') ||
    pick('administrative_area_level_2') ||
    pick('administrative_area_level_1') ||
    null
  );
}

function withLanguage(url: string, language?: string): string {
  if (!language) {
    return url;
  }
  return `${url}&language=${encodeURIComponent(language)}`;
}

function mapGeocodeResult(
  first: NonNullable<GeocodeApiResponse['results']>[number],
): GeocodeCityResult | null {
  const address = first.formatted_address?.trim();
  if (!address) {
    return null;
  }
  return {
    address,
    city: cityNameFromComponents(first.address_components),
    placeId: first.place_id?.trim() || null,
    latitude: first.geometry.location.lat,
    longitude: first.geometry.location.lng,
  };
}

async function fetchGeocode(url: string): Promise<GeocodeCityResult | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as GeocodeApiResponse;
    if (payload.status !== 'OK' || !payload.results?.length) {
      return null;
    }
    const first = payload.results[0];
    return first ? mapGeocodeResult(first) : null;
  } catch {
    return null;
  }
}

export async function reverseGeocodeDetails(
  latitude: number,
  longitude: number,
  apiKey: string,
  language?: string,
): Promise<{ address: string; city: string | null; placeId: string | null } | null> {
  if (!apiKey) {
    return null;
  }

  const url = withLanguage(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}` +
      `&key=${encodeURIComponent(apiKey)}`,
    language,
  );
  const mapped = await fetchGeocode(url);
  if (!mapped) {
    return null;
  }
  return {
    address: mapped.address,
    city: mapped.city,
    placeId: mapped.placeId,
  };
}

export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
  apiKey: string,
  language?: string,
): Promise<string | null> {
  const details = await reverseGeocodeDetails(latitude, longitude, apiKey, language);
  return details?.address ?? null;
}

export async function geocodePlaceId(
  placeId: string,
  apiKey: string,
  language?: string,
): Promise<GeocodeCityResult | null> {
  if (!placeId || !apiKey) {
    return null;
  }
  const url = withLanguage(
    `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(placeId)}` +
      `&key=${encodeURIComponent(apiKey)}`,
    language,
  );
  return fetchGeocode(url);
}

export async function geocodeAddress(
  address: string,
  apiKey: string,
  language?: string,
): Promise<GeocodeCityResult | null> {
  const trimmed = address.trim();
  if (!trimmed || !apiKey) {
    return null;
  }
  const url = withLanguage(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}` +
      `&key=${encodeURIComponent(apiKey)}`,
    language,
  );
  return fetchGeocode(url);
}

export async function searchMapLocations(
  query: string,
  apiKey: string,
  language?: string,
): Promise<MapSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || !apiKey) {
    return [];
  }

  const url = withLanguage(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}` +
      `&key=${encodeURIComponent(apiKey)}`,
    language,
  );

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }
    const payload = (await response.json()) as GeocodeApiResponse;
    if (payload.status !== 'OK' || !payload.results?.length) {
      return [];
    }
    return payload.results.slice(0, 5).map((result, index) => ({
      id: result.place_id?.trim() || `${result.geometry.location.lat}:${result.geometry.location.lng}:${index}`,
      label: result.formatted_address,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
    }));
  } catch {
    return [];
  }
}
