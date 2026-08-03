import type { NavigatorScreenParams } from '@react-navigation/native';

import type { HomeStackParamList } from './homeTypes';
import type { SettingsStackParamList } from './settingsTypes';
import type { VehicleRouteParamList } from './vehicleNavigation.types';

export type DashboardTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  MyListings: undefined;
  CreateTrip: undefined;
  Vehicle: NavigatorScreenParams<VehicleRouteParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

export type HomePanel = 'feed' | 'messages' | 'notifications';

export type { HomeStackParamList } from './homeTypes';
export type { SettingsStackParamList } from './settingsTypes';
export type { VehicleRouteParamList } from './vehicleNavigation.types';
