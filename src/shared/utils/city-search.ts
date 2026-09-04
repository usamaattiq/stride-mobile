import type { TripCity } from '@/features/dashboard/types/trip.types';
import { createPlacesSessionToken, locationsApi } from '@/services/api/locationsApi';

/**
 * Places Autocomplete restricted to cities/localities via stride-api.
 * @deprecated apiKey ignored — calls go through `/locations/autocomplete`.
 */
export async function searchCities(
  query: string,
  _apiKey?: string,
  language?: string,
): Promise<TripCity[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const predictions = await locationsApi.autocomplete({
    input: trimmed,
    sessiontoken: createPlacesSessionToken(),
    types: '(cities)',
    language,
  });

  return predictions.slice(0, 8).map((item) => ({
    id: item.placeId,
    label: item.description,
  }));
}
