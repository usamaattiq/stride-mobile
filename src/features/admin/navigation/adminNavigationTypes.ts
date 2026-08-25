import type { NavigatorScreenParams } from '@react-navigation/native';

import type { DashboardRootStackParamList } from '@/features/dashboard/navigation/dashboardRootTypes';
import type { SettingsStackParamList } from '@/features/dashboard/navigation/settingsTypes';

export type AdminTabParamList = {
  Users: undefined;
  Trips: undefined;
  Credits: undefined;
  Subzone: undefined;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};

export type AdminRootStackParamList = {
  MainTabs: NavigatorScreenParams<AdminTabParamList> | undefined;
  ListingDetail: DashboardRootStackParamList['ListingDetail'];
  UserDetail: { userId: string };
};
