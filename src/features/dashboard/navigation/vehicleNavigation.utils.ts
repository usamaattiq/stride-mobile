import type { NavigationProp } from '@react-navigation/native';

import type { VehicleStackOrigin } from './vehicleNavigation.types';

/** Infer whether the vehicle flow lives on the Vehicle tab or the trip root stack. */
export function resolveVehicleStackOrigin(
  navigation: NavigationProp<Record<string, object | undefined>>,
): VehicleStackOrigin {
  const rootRouteName = navigation.getState().routes[0]?.name;
  return rootRouteName === 'VehicleList' ? 'vehicles' : 'trip';
}
