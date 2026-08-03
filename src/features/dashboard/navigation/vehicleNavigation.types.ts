export type VehicleFlowReturnTo = 'VehicleList' | 'TripCreation' | 'VehicleView';

/** Which stack owns the active vehicle flow. */
export type VehicleStackOrigin = 'vehicles' | 'trip';

export type VehicleDetailsParams = {
  mode: 'add' | 'edit';
  vehicleId?: string;
  returnTo?: VehicleFlowReturnTo;
  stackOrigin?: VehicleStackOrigin;
};

export type VehiclePhotosParams = {
  returnTo?: VehicleFlowReturnTo;
  stackOrigin?: VehicleStackOrigin;
  /** When returning to VehicleView after save. */
  vehicleId?: string;
};

export type VehicleViewParams = {
  vehicleId: string;
};

export type VehicleRouteParamList = {
  VehicleList: undefined;
  VehicleView: VehicleViewParams;
  VehicleDetails: VehicleDetailsParams;
  VehiclePhotos: VehiclePhotosParams;
};
