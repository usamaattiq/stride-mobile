import type { Vehicle, VehicleClass } from './vehicle.types';

export type VehicleAcFilter = 'any' | 'ac' | 'nonAc';

export type VehicleBrowseFilters = {
  vehicleClass: VehicleClass | null;
  ac: VehicleAcFilter;
};

export const EMPTY_VEHICLE_BROWSE_FILTERS: VehicleBrowseFilters = {
  vehicleClass: null,
  ac: 'any',
};

export function countActiveVehicleBrowseFilters(filters: VehicleBrowseFilters): number {
  let count = 0;
  if (filters.vehicleClass) {
    count += 1;
  }
  if (filters.ac !== 'any') {
    count += 1;
  }
  return count;
}

export function matchesVehicleSearch(vehicle: Vehicle, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const haystack = [
    vehicle.title,
    vehicle.brand,
    vehicle.model,
    vehicle.plateNumber,
    vehicle.year,
    vehicle.vehicleClass,
    vehicle.description,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalized);
}

export function matchesVehicleFilters(
  vehicle: Vehicle,
  filters: VehicleBrowseFilters,
): boolean {
  if (filters.vehicleClass && vehicle.vehicleClass !== filters.vehicleClass) {
    return false;
  }
  if (filters.ac === 'ac' && !vehicle.hasAc) {
    return false;
  }
  if (filters.ac === 'nonAc' && vehicle.hasAc) {
    return false;
  }
  return true;
}
