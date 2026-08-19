import React from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import type { NavigationProp } from '@react-navigation/native';
import { getFocusedRouteNameFromRoute, StackActions, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';
import { getFontFamily } from '@/theme/typography';

import { flushPendingPingDeepLink } from '@/services/pingDeepLinkRouting';

import { CreateTripTabButton } from '../components/CreateTripTabButton';
import { TripProvider, useTrips } from '../context/TripContext';
import { VehicleProvider } from '../context/VehicleContext';
import { CreateTripTabScreen } from '../screens/CreateTripTabScreen';
import { TripCreationFlowScreen } from '../screens/TripCreationFlowScreen';
import { TripPublishSuccessScreen } from '../screens/TripPublishSuccessScreen';
import { VehicleDetailsScreen } from '../screens/VehicleDetailsScreen';
import { VehiclePhotosScreen } from '../screens/VehiclePhotosScreen';
import type { DashboardRootStackParamList } from './dashboardRootTypes';
import { openTripCreationFlow } from './homeStackNavigation';
import { HomeStackNavigator } from './HomeStackNavigator';
import { MyListingsScreen } from '../screens/MyListingsScreen';
import { MyOffersScreen } from '../screens/MyOffersScreen';
import { ListingDetailScreen } from '../screens/ListingDetailScreen';
import { SearchResultsScreen } from '../screens/SearchResultsScreen';
import { SettingsStackNavigator } from './SettingsStackNavigator';
import { VehicleStackNavigator } from './VehicleStackNavigator';
import type { DashboardTabParamList } from './types';

const Tab = createBottomTabNavigator<DashboardTabParamList>();
const RootStack = createNativeStackNavigator<DashboardRootStackParamList>();

type TabIconName = React.ComponentProps<typeof FontAwesome>['name'];

const TAB_ICONS: Record<Exclude<keyof DashboardTabParamList, 'CreateTrip'>, TabIconName> = {
  Home: 'home',
  MyListings: 'list-alt',
  MyOffers: 'tag',
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

const EXIT_CONFIRM_MS = 2000;

function nestedStackIndex(route: { state?: { index?: number } } | undefined): number {
  return route?.state?.index ?? 0;
}

function DashboardTabs(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const { beginCreateTrip } = useTrips();
  const rootNavigation = useNavigation<NavigationProp<DashboardRootStackParamList>>();
  const [exitHintVisible, setExitHintVisible] = React.useState(false);
  const lastBackAtRef = React.useRef(0);
  const hideHintTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeBottomInset = insets.bottom;
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + safeBottomInset + DRIVER_TAB_BAR_EXTRA;
  const defaultTabBarStyle = [styles.tabBar, { height: tabBarHeight, paddingBottom: safeBottomInset }];

  React.useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const onHardwareBack = () => {
      const rootState = rootNavigation.getState();
      const focusedRoot = rootState.routes[rootState.index];
      if (focusedRoot?.name !== 'MainTabs') {
        return false;
      }

      const tabState = focusedRoot.state;
      if (tabState) {
        const currentTab = tabState.routes[tabState.index];
        if (nestedStackIndex(currentTab) > 0) {
          return false;
        }
      }

      const now = Date.now();
      if (now - lastBackAtRef.current < EXIT_CONFIRM_MS) {
        lastBackAtRef.current = 0;
        setExitHintVisible(false);
        BackHandler.exitApp();
        return true;
      }

      lastBackAtRef.current = now;
      setExitHintVisible(true);
      if (hideHintTimerRef.current) {
        clearTimeout(hideHintTimerRef.current);
      }
      hideHintTimerRef.current = setTimeout(() => {
        setExitHintVisible(false);
        lastBackAtRef.current = 0;
      }, EXIT_CONFIRM_MS);
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => {
      sub.remove();
      if (hideHintTimerRef.current) {
        clearTimeout(hideHintTimerRef.current);
      }
    };
  }, [rootNavigation]);

  return (
    <View style={styles.tabsRoot}>
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
            : t(`dashboard.tabs.${route.name}`),
        tabBarLabelStyle: [
          styles.tabLabel,
          { fontFamily: getFontFamily(currentLanguage, 'medium') },
        ],
        tabBarIconStyle: styles.tabIcon,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: defaultTabBarStyle,
        tabBarIcon: ({ color }) => {
          if (route.name === 'CreateTrip') {
            return null;
          }
          const iconName =
            TAB_ICONS[route.name as Exclude<keyof DashboardTabParamList, 'CreateTrip'>];
          return <FontAwesome name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="MyListings" component={MyListingsScreen} />
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
      <Tab.Screen name="MyOffers" component={MyOffersScreen} />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={({ route }) => {
          const focusedRoute = getFocusedRouteNameFromRoute(route) ?? 'SettingsHome';
          const isSettingsHome = focusedRoute === 'SettingsHome';
          return {
            tabBarStyle: isSettingsHome
              ? defaultTabBarStyle
              : { display: 'none' },
          };
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            // Always land on Settings home when the tab is pressed,
            // even if a nested screen (e.g. General Information) is open.
            const settingsRoute = navigation
              .getState()
              .routes.find((tabRoute) => tabRoute.name === 'Settings');
            const nestedState = settingsRoute?.state;
            if (nestedState != null && (nestedState.index ?? 0) > 0) {
              navigation.dispatch({
                ...StackActions.popToTop(),
                target: nestedState.key,
              });
            }
          },
        })}
      />
    </Tab.Navigator>
      {exitHintVisible ? (
        <View
          pointerEvents="none"
          style={[styles.exitToastWrap, { bottom: tabBarHeight + spacing.sm }]}
        >
          <View style={styles.exitToast}>
            <AppText weight="medium" style={styles.exitToastText}>
              {t('dashboard.tabs.tapAgainToExit')}
            </AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function DashboardRoot(): React.ReactElement {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={DashboardTabs} />
      <RootStack.Screen name="TripCreation" component={TripCreationFlowScreen} />
      <RootStack.Screen name="TripPublishSuccess" component={TripPublishSuccessScreen} />
      <RootStack.Screen name="ManageVehicles" component={VehicleStackNavigator} />
      <RootStack.Screen name="VehicleDetails" component={VehicleDetailsScreen} />
      <RootStack.Screen name="VehiclePhotos" component={VehiclePhotosScreen} />
      <RootStack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <RootStack.Screen name="SearchResults" component={SearchResultsScreen} />
    </RootStack.Navigator>
  );
}

function DashboardDeepLinkFlush(): null {
  React.useEffect(() => {
    flushPendingPingDeepLink();
  }, []);
  return null;
}

export function DashboardNavigator(): React.ReactElement {
  return (
    <VehicleProvider>
      <TripProvider>
        <DashboardDeepLinkFlush />
        <DashboardRoot />
      </TripProvider>
    </VehicleProvider>
  );
}

const styles = StyleSheet.create({
  tabsRoot: {
    flex: 1,
  },
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
  exitToastWrap: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 20,
  },
  exitToast: {
    maxWidth: 260,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
  },
  exitToastText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.white,
  },
});
