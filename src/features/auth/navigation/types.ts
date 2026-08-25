import type { NavigatorScreenParams } from '@react-navigation/native';

import type { DashboardRootStackParamList } from '@/features/dashboard/navigation/dashboardRootTypes';

export type AuthStackParamList = {
  Welcome: undefined;
  SignupFlow: undefined;
  SignupSuccess: undefined;
  LoginFlow: undefined;
  Dashboard: NavigatorScreenParams<DashboardRootStackParamList> | undefined;
  Admin: undefined;
};
