import { CommonActions } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import type { DashboardRootStackParamList, TripCreationParams } from './dashboardRootTypes';
import type {
  VehicleFlowReturnTo,
  VehicleRouteParamList,
  VehicleStackOrigin,
} from './vehicleNavigation.types';

type VehicleFlowNavigation = NavigationProp<VehicleRouteParamList>;
type TripRootNavigation = NavigationProp<DashboardRootStackParamList>;

/** Accepts dashboard stack and nested screens (e.g. ListingDetail on admin vs user). */
export type OpenTripCreationNavigation = {
  getState: () => { index: number; routes: ReadonlyArray<{ name: string }> };
  dispatch: (action: ReturnType<typeof CommonActions.reset>) => void;
  navigate: (name: 'TripCreation', params?: TripCreationParams) => void;
};

type CompleteVehicleFlowOptions = {
  selectVehicleId?: string;
  stackOrigin?: VehicleStackOrigin;
  listingTripId?: string;
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

  if (returnTo === 'ListingDetail' && options?.listingTripId) {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'MainTabs' },
          {
            name: 'ListingDetail',
            params: {
              tripId: options.listingTripId,
              ...(options.selectVehicleId
                ? { selectVehicleId: options.selectVehicleId }
                : {}),
            },
          },
        ],
      }),
    );
    return;
  }

  navigation.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [{ name: 'MainTabs' }, { name: 'ManageVehicles' }],
    }),
  );
}

/**
 * Presents trip creation over the current tab — no tab switch, one smooth push.
 */
export function openTripCreationFlow(
  rootNavigation: OpenTripCreationNavigation,
  params?: Omit<TripCreationParams, 'flowKey'>,
): void {
  const nextParams = { flowKey: Date.now(), ...params };
  const state = rootNavigation.getState();
  const activeRoute = state.routes[state.index];

  if (activeRoute?.name === 'TripCreation') {
    rootNavigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'MainTabs' },
          { name: 'TripCreation', params: nextParams },
        ],
      }),
    );
    return;
  }

  rootNavigation.navigate('TripCreation', nextParams);
}

/** Dismisses trip creation and returns to the tab the user was on. */
export function exitTripCreation(rootNavigation: TripRootNavigation): void {
  if (rootNavigation.canGoBack()) {
    rootNavigation.goBack();
  }
}

/** After publish — land on My Listings. */
export function exitTripCreationToListings(
  rootNavigation: TripRootNavigation,
  options?: { screen?: 'MyListings' | 'Home' },
): void {
  rootNavigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          params: { screen: options?.screen ?? 'MyListings' },
        },
      ],
    }),
  );
}
