import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SecuritySettingsScreen } from '../screens/SecuritySettingsScreen';
import { SettingsHomeScreen } from '../screens/SettingsHomeScreen';
import type { SettingsStackParamList } from './settingsTypes';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsHomeScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
    </Stack.Navigator>
  );
}
