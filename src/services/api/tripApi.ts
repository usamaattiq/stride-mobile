import { apiRequest } from './client';
import type { CreateTripPayload, TripDto } from './tripApi.types';

export const tripApi = {
  list: (): Promise<TripDto[]> => apiRequest({ method: 'GET', url: '/trips' }),

  getById: (tripId: string): Promise<TripDto> =>
    apiRequest({ method: 'GET', url: `/trips/${tripId}` }),

  create: (payload: CreateTripPayload): Promise<TripDto> =>
    apiRequest({ method: 'POST', url: '/trips', data: payload }),

  remove: (tripId: string): Promise<{ deleted: true }> =>
    apiRequest({ method: 'DELETE', url: `/trips/${tripId}` }),
};
