import React from 'react';
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
