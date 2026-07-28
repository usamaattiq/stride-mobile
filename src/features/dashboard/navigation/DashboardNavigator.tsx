import React from 'react';
import { StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import type { NavigationProp } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { colors } from '@/theme';
import { getFontFamily } from '@/theme/typography';

import { CreateTripTabButton } from '../components/CreateTripTabButton';
import { useDashboardSession } from '../context/DashboardSessionContext';
import { TripProvider, useTrips } from '../context/TripContext';
import { VehicleProvider } from '../context/VehicleContext';
import { CreateTripTabScreen } from '../screens/CreateTripTabScreen';
import { TripCreationFlowScreen } from '../screens/TripCreationFlowScreen';
import { VehicleDetailsScreen } from '../screens/VehicleDetailsScreen';
import { VehiclePhotosScreen } from '../screens/VehiclePhotosScreen';
import type { DashboardRootStackParamList } from './dashboardRootTypes';
import { openTripCreationFlow } from './homeStackNavigation';
import { HomeStackNavigator } from './HomeStackNavigator';
import { MyListingsScreen } from '../screens/MyListingsScreen';
import { ListingDetailScreen } from '../screens/ListingDetailScreen';
import { MyOffersScreen } from '../screens/MyOffersScreen';
import { SettingsStackNavigator } from './SettingsStackNavigator';
import type { DashboardTabParamList } from './types';

const Tab = createBottomTabNavigator<DashboardTabParamList>();
const RootStack = createNativeStackNavigator<DashboardRootStackParamList>();

type TabIconName = React.ComponentProps<typeof FontAwesome>['name'];

const TAB_ICONS: Record<Exclude<keyof DashboardTabParamList, 'CreateTrip'>, TabIconName> = {
  Home: 'home',
  MyListings: 'list-alt',
  MyOffers: 'tags',
  Settings: 'cog',
};

/** Content area for icon + label. */
const TAB_BAR_CONTENT_HEIGHT = 64;
const DRIVER_TAB_BAR_EXTRA = 12;

function openTripCreation(
  rootNavigation: NavigationProp<DashboardRootStackParamList>,
  beginCreateTrip: () => void,
): void {
  beginCreateTrip();
  openTripCreationFlow(rootNavigation);
}

function DashboardTabs(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const { user } = useDashboardSession();
  const { beginCreateTrip } = useTrips();
  const isDriver = user.role === 'driver';

  const safeBottomInset = insets.bottom;
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + safeBottomInset + (isDriver ? DRIVER_TAB_BAR_EXTRA : 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarShowLabel: route.name !== 'CreateTrip',
        tabBarLabelPosition: 'below-icon',
        tabBarLabel:
          route.name === 'CreateTrip'
            ? undefined
            : route.name === 'MyListings' && !isDriver
              ? t('dashboard.tabs.Search')
              : t(`dashboard.tabs.${route.name}`),
        tabBarLabelStyle: [
          styles.tabLabel,
          { fontFamily: getFontFamily(currentLanguage, 'medium') },
        ],
        tabBarIconStyle: styles.tabIcon,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: [styles.tabBar, { height: tabBarHeight, paddingBottom: safeBottomInset }],
        tabBarIcon: ({ color }) => {
          if (route.name === 'CreateTrip') {
            return null;
          }
          const iconName =
            route.name === 'MyListings' && !isDriver
              ? 'search'
              : TAB_ICONS[route.name as Exclude<keyof DashboardTabParamList, 'CreateTrip'>];
          return <FontAwesome name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="MyListings" component={MyListingsScreen} />
      {isDriver ? (
        <Tab.Screen
          name="CreateTrip"
          component={CreateTripTabScreen}
          listeners={({ navigation }) => ({
            tabPress: (event) => {
              event.preventDefault();
              const rootNavigation =
                navigation.getParent<NavigationProp<DashboardRootStackParamList>>();
              if (rootNavigation) {
                openTripCreation(rootNavigation, beginCreateTrip);
              }
            },
          })}
          options={{
            tabBarLabel: () => null,
            tabBarButton: (props) => <CreateTripTabButton {...props} />,
          }}
        />
      ) : null}
      <Tab.Screen name="MyOffers" component={MyOffersScreen} />
      <Tab.Screen name="Settings" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
}

function DashboardRoot(): React.ReactElement {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={DashboardTabs} />
      <RootStack.Screen name="TripCreation" component={TripCreationFlowScreen} />
      <RootStack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
      <RootStack.Screen name="VehiclePhotos" component={VehiclePhotosScreen} />
      <RootStack.Screen name="ListingDetail" component={ListingDetailScreen} />
    </RootStack.Navigator>
  );
}

export function DashboardNavigator(): React.ReactElement {
  return (
    <VehicleProvider>
      <TripProvider>
        <DashboardRoot />
      </TripProvider>
    </VehicleProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.border.default,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    paddingTop: 6,
  },
  tabIcon: {
    marginTop: 0,
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
    marginBottom: 2,
  },
});
