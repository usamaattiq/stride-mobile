import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DriverVerificationScreen } from '../screens/DriverVerificationScreen';
import { GeneralInformationScreen } from '../screens/GeneralInformationScreen';
import { SecuritySettingsScreen } from '../screens/SecuritySettingsScreen';
import { SettingsHomeScreen } from '../screens/SettingsHomeScreen';
import { VehicleDetailsScreen } from '../screens/VehicleDetailsScreen';
import { VehicleListScreen } from '../screens/VehicleListScreen';
import { VehiclePhotosScreen } from '../screens/VehiclePhotosScreen';
import type { SettingsStackParamList } from './settingsTypes';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsHomeScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <Stack.Screen name="DriverVerification" component={DriverVerificationScreen} />
      <Stack.Screen name="GeneralInformation" component={GeneralInformationScreen} />
      <Stack.Screen name="VehicleList" component={VehicleListScreen} />
      <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
      <Stack.Screen name="VehiclePhotos" component={VehiclePhotosScreen} />
    </Stack.Navigator>
  );
}
