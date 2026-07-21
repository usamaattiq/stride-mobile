import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DashboardSessionProvider } from '@/features/dashboard/context/DashboardSessionContext';
import { DashboardNavigator } from '@/features/dashboard/navigation/DashboardNavigator';
import { navigationRef } from '@/navigation/navigationRef';
import { colors } from '@/theme';

import { LoginFlowScreen } from '../screens/LoginFlowScreen';
import { SignupFlowScreen } from '../screens/SignupFlowScreen';
import { SignupSuccessRoute, WelcomeRoute } from './routes';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.white,
  },
};

/**
 * Match bt-app: default native-stack options only.
 * Signup/login step changes happen inside flow screens (setStep), not stack pushes.
 */
export function AuthNavigator({
  initialRouteName = 'Welcome',
}: {
  initialRouteName?: keyof AuthStackParamList;
}): React.ReactElement {
  return (
    <DashboardSessionProvider>
      <NavigationContainer theme={navigationTheme} ref={navigationRef}>
        <Stack.Navigator
          initialRouteName={initialRouteName}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeRoute} />
          <Stack.Screen name="SignupFlow" component={SignupFlowScreen} />
          <Stack.Screen name="SignupSuccess" component={SignupSuccessRoute} />
          <Stack.Screen name="LoginFlow" component={LoginFlowScreen} />
          <Stack.Screen name="Dashboard" component={DashboardNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </DashboardSessionProvider>
  );
}
