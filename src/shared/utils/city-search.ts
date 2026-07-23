import type { TripCity } from '@/features/dashboard/types/trip.types';

type PlacesAutocompleteResponse = {
  status: string;
  predictions?: Array<{
    description: string;
    place_id: string;
  }>;
};

/**
 * Google Places Autocomplete restricted to cities/localities.
 * Requires Places API + the same key as the map picker.
 */
export async function searchCities(query: string, apiKey: string): Promise<TripCity[]> {
  const trimmed = query.trim();
  if (!trimmed || !apiKey) {
    return [];
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(trimmed)}` +
    `&types=(cities)&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url);
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as PlacesAutocompleteResponse;
  if (payload.status !== 'OK' || !payload.predictions?.length) {
    return [];
  }

  return payload.predictions.slice(0, 8).map((item) => ({
    id: item.place_id,
    label: item.description,
  }));
}
