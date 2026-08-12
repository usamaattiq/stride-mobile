import type { ImageSourcePropType } from 'react-native';

import type { VehicleClass } from '../types/vehicle.types';

export type VehicleClassOption = {
  id: Exclude<VehicleClass, 'coaster'>;
  labelKey: `vehicles.classes.${Exclude<VehicleClass, 'coaster'>}`;
};

/** Selectable vehicle types only — coaster kept in types for legacy API data. */
export const VEHICLE_CLASS_OPTIONS: VehicleClassOption[] = [
  { id: 'sedan', labelKey: 'vehicles.classes.sedan' },
  { id: 'suv', labelKey: 'vehicles.classes.suv' },
  { id: 'van', labelKey: 'vehicles.classes.van' },
  { id: 'bus', labelKey: 'vehicles.classes.bus' },
];

const SEDAN_ICON = require('@/assets/images/sedan.png');
const SUV_ICON = require('@/assets/images/suv.png');
const VAN_ICON = require('@/assets/images/van.png');
const BUS_ICON = require('@/assets/images/bus.png');

/** Class artwork for passenger request cards / pickers. Legacy `coaster` maps to bus. */
export const VEHICLE_CLASS_IMAGES: Record<VehicleClass, ImageSourcePropType> = {
  sedan: SEDAN_ICON,
  suv: SUV_ICON,
  van: VAN_ICON,
  bus: BUS_ICON,
  coaster: BUS_ICON,
};

export function getVehicleClassImage(
  vehicleClass: VehicleClass | null | undefined,
): ImageSourcePropType | null {
  if (!vehicleClass) {
    return null;
  }
  return VEHICLE_CLASS_IMAGES[vehicleClass] ?? null;
}

export function getVehicleClassLabelKey(
  vehicleClass: VehicleClass | null | undefined,
): `vehicles.classes.${VehicleClass}` | 'vehicles.classPlaceholder' {
  if (!vehicleClass) {
    return 'vehicles.classPlaceholder';
  }
  if (vehicleClass === 'coaster') {
    return 'vehicles.classes.bus';
  }
  return `vehicles.classes.${vehicleClass}`;
}
