import type React from 'react';
import type { FontAwesome } from '@expo/vector-icons';

import type { TripLuggageType, TripRouteType } from '../types/trip.types';

type FontAwesomeIcon = React.ComponentProps<typeof FontAwesome>['name'];

export const ROUTE_TYPE_ICONS: Record<TripRouteType, FontAwesomeIcon> = {
  land: 'road',
  sea: 'ship',
  air: 'plane',
};

export const ROUTE_TYPE_LABEL_KEYS: Record<TripRouteType, string> = {
  land: 'trips.create.routeTypeLand',
  sea: 'trips.create.routeTypeSea',
  air: 'trips.create.routeTypeAir',
};

export const LUGGAGE_TYPE_LABEL_KEYS: Record<TripLuggageType, string> = {
  suitcase: 'trips.create.luggageType_suitcase',
  backpack: 'trips.create.luggageType_backpack',
  duffel: 'trips.create.luggageType_duffel',
  box: 'trips.create.luggageType_box',
  other: 'trips.create.luggageType_other',
};
