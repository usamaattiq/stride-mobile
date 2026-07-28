import type { TripCity, TripPaymentMethod, TripVehicleMode } from './trip.types';

export type TripListingCategory = 'all' | 'rfq' | 'auction';

export type TripBrowseFilters = {
  paymentMethod: TripPaymentMethod | null;
  departureCity: TripCity | null;
  arrivalCity: TripCity | null;
  vehicleMode: TripVehicleMode | null;
  minSeats: number | null;
};

export const EMPTY_TRIP_BROWSE_FILTERS: TripBrowseFilters = {
  paymentMethod: null,
  departureCity: null,
  arrivalCity: null,
  vehicleMode: null,
  minSeats: null,
};

export function countActiveTripBrowseFilters(filters: TripBrowseFilters): number {
  let count = 0;
  if (filters.paymentMethod) {
    count += 1;
  }
  if (filters.departureCity) {
    count += 1;
  }
  if (filters.arrivalCity) {
    count += 1;
  }
  if (filters.vehicleMode) {
    count += 1;
  }
  if (filters.minSeats != null) {
    count += 1;
  }
  return count;
}
