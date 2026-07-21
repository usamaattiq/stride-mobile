import { CommonActions } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import type { HomeStackParamList, VehicleFlowReturnTo } from './homeTypes';

type HomeStackNavigation = NavigationProp<HomeStackParamList>;

/**
 * Rebuilds the home stack after a nested sub-flow completes.
 *
 * `navigate(returnTarget)` is not enough here: React Navigation may keep
 * VehicleDetails / VehiclePhotos beneath TripCreation, so Back from the wizard
 * re-enters the add-vehicle screens. Reset gives explicit stack hygiene.
 */
export function completeVehicleFlow(
  navigation: HomeStackNavigation,
  returnTo: VehicleFlowReturnTo,
  options?: { selectVehicleId?: string },
): void {
  if (returnTo === 'TripCreation') {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'HomeMain' },
          {
            name: 'TripCreation',
            params: options?.selectVehicleId
              ? { selectVehicleId: options.selectVehicleId }
              : undefined,
          },
        ],
      }),
    );
    return;
  }

  navigation.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [{ name: 'HomeMain' }, { name: 'VehicleList' }],
    }),
  );
}

/**
 * Leaves trip creation and returns to the home feed with a clean stack.
 */
export function exitTripCreationToHome(navigation: HomeStackNavigation): void {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'HomeMain' }],
    }),
  );
}
