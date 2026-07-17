import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DriverVerificationScreen } from '../screens/DriverVerificationScreen';
import { GeneralInformationScreen } from '../screens/GeneralInformationScreen';
import { SecuritySettingsScreen } from '../screens/SecuritySettingsScreen';
import { SettingsHomeScreen } from '../screens/SettingsHomeScreen';
import type { SettingsStackParamList } from './settingsTypes';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsHomeScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <Stack.Screen name="DriverVerification" component={DriverVerificationScreen} />
      <Stack.Screen name="GeneralInformation" component={GeneralInformationScreen} />
    </Stack.Navigator>
  );
}
