import { CommonActions } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import type { DashboardRootStackParamList } from './dashboardRootTypes';
import type {
  VehicleFlowReturnTo,
  VehicleRouteParamList,
  VehicleStackOrigin,
} from './vehicleNavigation.types';

type VehicleFlowNavigation = NavigationProp<VehicleRouteParamList>;
type TripRootNavigation = NavigationProp<DashboardRootStackParamList>;

type CompleteVehicleFlowOptions = {
  selectVehicleId?: string;
  stackOrigin?: VehicleStackOrigin;
};

/**
 * Rebuilds the stack after a nested vehicle sub-flow completes.
 */
export function completeVehicleFlow(
  navigation: VehicleFlowNavigation | TripRootNavigation,
  returnTo: VehicleFlowReturnTo,
  options?: CompleteVehicleFlowOptions,
): void {
  const origin = options?.stackOrigin ?? 'trip';

  if (origin === 'vehicles') {
    if (returnTo === 'VehicleView' && options?.selectVehicleId) {
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: 'VehicleList' },
            {
              name: 'VehicleView',
              params: { vehicleId: options.selectVehicleId },
            },
          ],
        }),
      );
      return;
    }
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'VehicleList' }],
      }),
    );
    return;
  }

  if (returnTo === 'TripCreation') {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'MainTabs' },
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
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          params: { screen: 'Vehicle', params: { screen: 'VehicleList' } },
        },
      ],
    }),
  );
}

/**
 * Presents trip creation over the current tab — no tab switch, one smooth push.
 */
export function openTripCreationFlow(rootNavigation: TripRootNavigation): void {
  const state = rootNavigation.getState();
  const activeRoute = state.routes[state.index];

  if (activeRoute?.name === 'TripCreation') {
    rootNavigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'MainTabs' },
          { name: 'TripCreation', params: { flowKey: Date.now() } },
        ],
      }),
    );
    return;
  }

  rootNavigation.navigate('TripCreation', { flowKey: Date.now() });
}

/** Dismisses trip creation and returns to the tab the user was on. */
export function exitTripCreation(rootNavigation: TripRootNavigation): void {
  if (rootNavigation.canGoBack()) {
    rootNavigation.goBack();
  }
}

/** After publish — land on My Listings so the new trip is visible. */
export function exitTripCreationToListings(rootNavigation: TripRootNavigation): void {
  rootNavigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          params: { screen: 'MyListings' },
        },
      ],
    }),
  );
}
