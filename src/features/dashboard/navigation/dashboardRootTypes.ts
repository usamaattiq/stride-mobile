import type { NavigatorScreenParams } from '@react-navigation/native';

import type { TripCity, TripVehicleMode } from '../types/trip.types';
import type { DashboardTabParamList } from './types';
import type { VehicleDetailsParams, VehiclePhotosParams } from './vehicleNavigation.types';

export type TripCreationParams = {
  selectVehicleId?: string;
  /** Changes each time the FAB opens a new trip flow — remounts wizard step state. */
  flowKey?: number;
};

export type SearchResultsParams = {
  departureCity: TripCity;
  arrivalCity: TripCity;
  departureDateISO: string;
  /** Inclusive end of the search date window. Defaults to departureDateISO when omitted. */
  departureUntilISO?: string;
  vehicleMode: TripVehicleMode;
  passengerCount: number;
};

export type DashboardRootStackParamList = {
  MainTabs: NavigatorScreenParams<DashboardTabParamList> | undefined;
  TripCreation: TripCreationParams | undefined;
  TripPublishSuccess: undefined;
  ManageVehicles: undefined;
  VehicleDetails: VehicleDetailsParams;
  VehiclePhotos: VehiclePhotosParams;
  ListingDetail: { tripId: string; selectVehicleId?: string; viewerIsOwner?: boolean };
  SearchResults: SearchResultsParams;
};
