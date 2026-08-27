import type { NavigatorScreenParams } from '@react-navigation/native';

import type { DashboardRootStackParamList } from '@/features/dashboard/navigation/dashboardRootTypes';
import type { SettingsStackParamList } from '@/features/dashboard/navigation/settingsTypes';

export type AdminUsersStackParamList = {
  UsersHome: undefined;
  UserDetail: { userId: string; listRole?: 'passenger' | 'driver' };
};

export type AdminTripsStackParamList = {
  TripsHome: undefined;
  ListingDetail: DashboardRootStackParamList['ListingDetail'];
  UserDetail: { userId: string; listRole?: 'passenger' | 'driver' };
};

export type AdminCreditsStackParamList = {
  CreditsHome: undefined;
  CreditPurchaseDetail: { purchaseId: string };
  UserDetail: { userId: string; listRole?: 'passenger' | 'driver' };
};

export type AdminTabParamList = {
  Home: undefined;
  Users: NavigatorScreenParams<AdminUsersStackParamList>;
  Trips: NavigatorScreenParams<AdminTripsStackParamList>;
  Credits: NavigatorScreenParams<AdminCreditsStackParamList>;
  Subzone: undefined;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};
