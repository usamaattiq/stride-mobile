import type { VehicleClass } from './vehicle.types';
import type { TripCity, TripListingType, TripPaymentMethod, TripVehicleMode } from './trip.types';

export type TripListingCategory = 'all' | 'rfq' | 'auction';

export type PriceRange = {
  min: number | null;
  max: number | null;
};

/** Extra filters surfaced from a search-results screen (route/date/mode already fixed by the search form). */
export type SearchResultsFilters = {
  listingType: TripListingType | null;
  paymentMethod: TripPaymentMethod | null;
  vehicleClass: VehicleClass | null;
  priceRange: PriceRange;
};

export const EMPTY_SEARCH_RESULTS_FILTERS: SearchResultsFilters = {
  listingType: null,
  paymentMethod: null,
  vehicleClass: null,
  priceRange: { min: null, max: null },
};

export function countActiveSearchResultsFilters(filters: SearchResultsFilters): number {
  let count = 0;
  if (filters.listingType) {
    count += 1;
  }
  if (filters.paymentMethod) {
    count += 1;
  }
  if (filters.vehicleClass) {
    count += 1;
  }
  if (filters.priceRange.min != null || filters.priceRange.max != null) {
    count += 1;
  }
  return count;
}

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
