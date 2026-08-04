import type { VehicleClass } from '../types/vehicle.types';

export type VehicleClassOption = {
  id: VehicleClass;
  labelKey: `vehicles.classes.${VehicleClass}`;
};

export const VEHICLE_CLASS_OPTIONS: VehicleClassOption[] = [
  { id: 'suv', labelKey: 'vehicles.classes.suv' },
  { id: 'sedan', labelKey: 'vehicles.classes.sedan' },
  { id: 'bus', labelKey: 'vehicles.classes.bus' },
  { id: 'van', labelKey: 'vehicles.classes.van' },
  { id: 'coaster', labelKey: 'vehicles.classes.coaster' },
];

export const VEHICLE_CLASS_ICONS: Record<
  VehicleClass,
  'car-side' | 'car' | 'bus' | 'shuttle-van'
> = {
  suv: 'car-side',
  sedan: 'car',
  bus: 'bus',
  van: 'shuttle-van',
  coaster: 'bus',
};
