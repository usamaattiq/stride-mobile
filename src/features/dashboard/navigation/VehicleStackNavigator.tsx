import React from 'react';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { VehicleDetailsScreen } from '../screens/VehicleDetailsScreen';
import { VehicleListScreen } from '../screens/VehicleListScreen';
import { VehiclePhotosScreen } from '../screens/VehiclePhotosScreen';
import { VehicleViewScreen } from '../screens/VehicleViewScreen';
import type { VehicleRouteParamList } from './vehicleNavigation.types';

const Stack = createNativeStackNavigator<VehicleRouteParamList>();

export function VehicleStackNavigator(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VehicleList" component={VehicleListScreen} />
      <Stack.Screen name="VehicleView" component={VehicleViewScreen} />
      <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
      <Stack.Screen name="VehiclePhotos" component={VehiclePhotosScreen} />
    </Stack.Navigator>
  );
}

/** Hide the tab bar while viewing or editing a vehicle inside the Vehicle tab. */
export function shouldHideVehicleTabBar(
  route: Parameters<typeof getFocusedRouteNameFromRoute>[0],
): boolean {
  const focusedRoute = getFocusedRouteNameFromRoute(route) ?? 'VehicleList';
  return focusedRoute !== 'VehicleList';
}
