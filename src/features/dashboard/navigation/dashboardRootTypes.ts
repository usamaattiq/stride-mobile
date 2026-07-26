import type { VehicleDetailsParams, VehiclePhotosParams } from './vehicleNavigation.types';

export type TripCreationParams = {
  selectVehicleId?: string;
  /** Changes each time the FAB opens a new trip flow — remounts wizard step state. */
  flowKey?: number;
};

export type DashboardRootStackParamList = {
  MainTabs: undefined;
  TripCreation: TripCreationParams | undefined;
  VehicleDetails: VehicleDetailsParams;
  VehiclePhotos: VehiclePhotosParams;
  ListingDetail: { tripId: string };
};
