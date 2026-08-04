export type VehicleFlowReturnTo = 'VehicleList' | 'TripCreation' | 'VehicleView' | 'ListingDetail';

/** Which stack owns the active vehicle flow. */
export type VehicleStackOrigin = 'vehicles' | 'trip';

export type VehicleDetailsParams = {
  mode: 'add' | 'edit';
  vehicleId?: string;
  returnTo?: VehicleFlowReturnTo;
  stackOrigin?: VehicleStackOrigin;
  /** When returnTo is ListingDetail, pop back to this request after save. */
  listingTripId?: string;
};

export type VehiclePhotosParams = {
  returnTo?: VehicleFlowReturnTo;
  stackOrigin?: VehicleStackOrigin;
  /** When returning to VehicleView after save. */
  vehicleId?: string;
  /** When returnTo is ListingDetail, pop back to this request after save. */
  listingTripId?: string;
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
