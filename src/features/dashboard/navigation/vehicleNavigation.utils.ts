import type { NavigationProp } from '@react-navigation/native';

import type { VehicleStackOrigin } from './vehicleNavigation.types';

/** Infer whether the vehicle flow lives on Settings or the trip root stack. */
export function resolveVehicleStackOrigin(
  navigation: NavigationProp<Record<string, object | undefined>>,
): VehicleStackOrigin {
  const rootRouteName = navigation.getState().routes[0]?.name;
  return rootRouteName === 'SettingsHome' ? 'settings' : 'trip';
}
