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

export type AdminCreditsStackParamList = {
  CreditsHome: undefined;
  CreditPurchaseRequests: undefined;
  CreditPurchaseDetail: { purchaseId: string };
};

export type AdminTabParamList = {
  Users: NavigatorScreenParams<AdminUsersStackParamList>;
  Trips: NavigatorScreenParams<AdminTripsStackParamList>;
  Credits: NavigatorScreenParams<AdminCreditsStackParamList>;
  Subzone: undefined;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};
