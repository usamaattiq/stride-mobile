import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '@/features/dashboard/screens/HomeScreen';
import { BuyCreditsScreen } from '@/features/dashboard/screens/BuyCreditsScreen';
import { BuyCreditRequestDetailScreen } from '@/features/dashboard/screens/BuyCreditRequestDetailScreen';

import type { HomeStackParamList } from './homeTypes';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="BuyCredits" component={BuyCreditsScreen} />
      <Stack.Screen name="BuyCreditRequestDetail" component={BuyCreditRequestDetailScreen} />
    </Stack.Navigator>
  );
}
