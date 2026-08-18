import { apiRequest } from './client';
import type { BrowseTripsParams, CreateTripPayload, PaginatedTripsDto, TripDto } from './tripApi.types';

function buildBrowseQuery(params: BrowseTripsParams): string {
  const search = new URLSearchParams();
  if (params.q?.trim()) {
    search.set('q', params.q.trim());
  }
  if (params.kind) {
    search.set('kind', params.kind);
  }
  if (params.listingType) {
    search.set('listingType', params.listingType);
  }
  if (params.paymentMethod) {
    search.set('paymentMethod', params.paymentMethod);
  }
  if (params.departureCity) {
    search.set('departureCity', params.departureCity);
  }
  if (params.departureCityId) {
    search.set('departureCityId', params.departureCityId);
  }
  if (params.arrivalCity) {
    search.set('arrivalCity', params.arrivalCity);
  }
  if (params.arrivalCityId) {
    search.set('arrivalCityId', params.arrivalCityId);
  }
  if (params.vehicleMode) {
    search.set('vehicleMode', params.vehicleMode);
  }
  if (params.vehicleClass) {
    search.set('vehicleClass', params.vehicleClass);
  }
  if (params.minSeats != null) {
    search.set('minSeats', String(params.minSeats));
  }
  if (params.page != null) {
    search.set('page', String(params.page));
  }
  if (params.limit != null) {
    search.set('limit', String(params.limit));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const tripApi = {
  list: (): Promise<TripDto[]> => apiRequest({ method: 'GET', url: '/trips' }),

  /** Trips the viewer has offered on (My Offers tab). */
  listMyOffers: (): Promise<TripDto[]> => apiRequest({ method: 'GET', url: '/trips/offers' }),

  browse: (params: BrowseTripsParams = {}): Promise<PaginatedTripsDto> =>
    apiRequest({ method: 'GET', url: `/trips/browse${buildBrowseQuery(params)}` }),

  getById: (tripId: string): Promise<TripDto> =>
    apiRequest({ method: 'GET', url: `/trips/${tripId}` }),

  create: (payload: CreateTripPayload): Promise<TripDto> =>
    apiRequest({ method: 'POST', url: '/trips', data: payload }),

  remove: (tripId: string): Promise<{ deleted: true }> =>
    apiRequest({ method: 'DELETE', url: `/trips/${tripId}` }),
};
