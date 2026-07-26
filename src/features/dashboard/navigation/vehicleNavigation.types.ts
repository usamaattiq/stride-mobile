export type VehicleFlowReturnTo = 'VehicleList' | 'TripCreation';

/** Which stack owns the active vehicle flow. */
export type VehicleStackOrigin = 'settings' | 'trip';

export type VehicleDetailsParams = {
  mode: 'add' | 'edit';
  vehicleId?: string;
  returnTo?: VehicleFlowReturnTo;
  stackOrigin?: VehicleStackOrigin;
};

export type VehiclePhotosParams = {
  returnTo?: VehicleFlowReturnTo;
  stackOrigin?: VehicleStackOrigin;
};

export type VehicleRouteParamList = {
  VehicleList: undefined;
  VehicleDetails: VehicleDetailsParams;
  VehiclePhotos: VehiclePhotosParams;
};
