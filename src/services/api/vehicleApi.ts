import { apiRequest } from './client';
import type { VehicleDto, VehiclePayload } from './vehicleApi.types';

export const vehicleApi = {
  list: (): Promise<VehicleDto[]> => apiRequest({ method: 'GET', url: '/vehicles' }),

  getById: (vehicleId: string): Promise<VehicleDto> =>
    apiRequest({ method: 'GET', url: `/vehicles/${vehicleId}` }),

  create: (payload: VehiclePayload): Promise<VehicleDto> =>
    apiRequest({ method: 'POST', url: '/vehicles', data: payload }),

  update: (vehicleId: string, payload: Partial<VehiclePayload>): Promise<VehicleDto> =>
    apiRequest({ method: 'PATCH', url: `/vehicles/${vehicleId}`, data: payload }),

  remove: (vehicleId: string): Promise<{ deleted: true }> =>
    apiRequest({ method: 'DELETE', url: `/vehicles/${vehicleId}` }),
};
