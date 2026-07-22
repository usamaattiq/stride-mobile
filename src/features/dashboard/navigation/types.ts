import type { NavigatorScreenParams } from '@react-navigation/native';

import type { HomeStackParamList } from './homeTypes';
import type { SettingsStackParamList } from './settingsTypes';

export type DashboardTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  MyListings: undefined;
  CreateTrip: undefined;
  MyOffers: undefined;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

export type HomePanel = 'feed' | 'messages' | 'notifications';

export type { HomeStackParamList } from './homeTypes';
export type { SettingsStackParamList } from './settingsTypes';
