export type MapSearchResult = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

type GeocodeApiResponse = {
  status: string;
  results?: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
};

export async function searchMapLocations(
  query: string,
  apiKey: string,
): Promise<MapSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || !apiKey) return [];

  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}` +
    `&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url);
  if (!response.ok) return [];

  const payload = (await response.json()) as GeocodeApiResponse;
  if (payload.status !== 'OK' || !payload.results?.length) return [];

  return payload.results.slice(0, 5).map((result, index) => ({
    id: `${result.geometry.location.lat}:${result.geometry.location.lng}:${index}`,
    label: result.formatted_address,
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
  }));
}
