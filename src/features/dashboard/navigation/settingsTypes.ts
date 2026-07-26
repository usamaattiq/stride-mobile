import type { VehicleRouteParamList } from './vehicleNavigation.types';

export type DriverVerificationPurpose = 'become' | 'complete';

export type SettingsStackParamList = VehicleRouteParamList & {
  SettingsHome: undefined;
  SecuritySettings: undefined;
  DriverVerification: { purpose?: DriverVerificationPurpose } | undefined;
  NicVerification: undefined;
  GeneralInformation: undefined;
};
