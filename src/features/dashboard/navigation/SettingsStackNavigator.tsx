import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AdminBankAccountsScreen } from '@/features/admin/screens/AdminBankAccountsScreen';
import { DriverVerificationScreen } from '../screens/DriverVerificationScreen';
import { GeneralInformationScreen } from '../screens/GeneralInformationScreen';
import { NicVerificationScreen } from '../screens/NicVerificationScreen';
import { SecuritySettingsScreen } from '../screens/SecuritySettingsScreen';
import { SettingsHomeScreen } from '../screens/SettingsHomeScreen';
import type { SettingsStackParamList } from './settingsTypes';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, freezeOnBlur: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsHomeScreen} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
      <Stack.Screen name="DriverVerification" component={DriverVerificationScreen} />
      <Stack.Screen name="NicVerification" component={NicVerificationScreen} />
      <Stack.Screen name="GeneralInformation" component={GeneralInformationScreen} />
      <Stack.Screen name="BankAccounts" component={AdminBankAccountsScreen} />
    </Stack.Navigator>
  );
}
