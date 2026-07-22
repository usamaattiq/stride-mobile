import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '@/features/dashboard/screens/HomeScreen';

import type { HomeStackParamList } from './homeTypes';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
  );
}
