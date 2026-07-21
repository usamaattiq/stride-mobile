export type VehicleFlowReturnTo = 'VehicleList' | 'TripCreation';

export type HomeStackParamList = {
  HomeMain: undefined;
  VehicleList: undefined;
  VehicleDetails: {
    mode: 'add' | 'edit';
    vehicleId?: string;
    returnTo?: VehicleFlowReturnTo;
  };
  VehiclePhotos: {
    returnTo?: VehicleFlowReturnTo;
  };
  TripCreation: {
    selectVehicleId?: string;
  } | undefined;
};
