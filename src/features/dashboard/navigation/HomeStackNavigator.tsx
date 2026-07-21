import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '@/features/dashboard/screens/HomeScreen';
import { VehicleDetailsScreen } from '@/features/dashboard/screens/VehicleDetailsScreen';
import { VehicleListScreen } from '@/features/dashboard/screens/VehicleListScreen';
import { VehiclePhotosScreen } from '@/features/dashboard/screens/VehiclePhotosScreen';

import type { HomeStackParamList } from './homeTypes';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="VehicleList" component={VehicleListScreen} />
      <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
      <Stack.Screen name="VehiclePhotos" component={VehiclePhotosScreen} />
    </Stack.Navigator>
  );
}
