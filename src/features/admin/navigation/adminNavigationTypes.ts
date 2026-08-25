import type { NavigatorScreenParams } from '@react-navigation/native';

import type { DashboardRootStackParamList } from '@/features/dashboard/navigation/dashboardRootTypes';
import type { SettingsStackParamList } from '@/features/dashboard/navigation/settingsTypes';

export type AdminUsersStackParamList = {
  UsersHome: undefined;
  UserDetail: { userId: string; listRole: 'passenger' | 'driver' };
};

export type AdminTripsStackParamList = {
  TripsHome: undefined;
  ListingDetail: DashboardRootStackParamList['ListingDetail'];
};

export type AdminTabParamList = {
  Users: NavigatorScreenParams<AdminUsersStackParamList>;
  Trips: NavigatorScreenParams<AdminTripsStackParamList>;
  Credits: undefined;
  Subzone: undefined;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};
