import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute, StackActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TripProvider } from '@/features/dashboard/context/TripContext';
import { ListingDetailScreen } from '@/features/dashboard/screens/ListingDetailScreen';
import { SettingsStackNavigator } from '@/features/dashboard/navigation/SettingsStackNavigator';
import { colors } from '@/theme';

import { AdminHomeScreen } from '../screens/AdminHomeScreen';
import { AdminCreditsScreen } from '../screens/AdminCreditsScreen';
import { AdminCreditSettingsScreen } from '../screens/AdminCreditSettingsScreen';
import { AdminCreditPurchaseDetailScreen } from '../screens/AdminCreditPurchaseDetailScreen';
import { AdminCreditPurchaseListScreen } from '../screens/AdminCreditPurchaseListScreen';
import { AdminSubzoneScreen } from '../screens/AdminSubzoneScreen';
import { AdminTripsScreen } from '../screens/AdminTripsScreen';
import { AdminUserDetailScreen } from '../screens/AdminUserDetailScreen';
import { AdminUsersScreen } from '../screens/AdminUsersScreen';
import { AdminTabLabel } from './AdminTabLabel';
import type {
  AdminCreditsStackParamList,
  AdminTabParamList,
  AdminTripsStackParamList,
  AdminUsersStackParamList,
} from './adminNavigationTypes';

const Tab = createBottomTabNavigator<AdminTabParamList>();
const UsersStack = createNativeStackNavigator<AdminUsersStackParamList>();
const TripsStack = createNativeStackNavigator<AdminTripsStackParamList>();
const CreditsStack = createNativeStackNavigator<AdminCreditsStackParamList>();

const TAB_BAR_CONTENT_HEIGHT = 64;
const TAB_BAR_EXTRA = 12;

const TAB_ICONS: Record<
  Exclude<keyof AdminTabParamList, 'Settings'>,
  React.ComponentProps<typeof FontAwesome>['name']
> = {
  Home: 'home',
  Users: 'users',
  Trips: 'map',
  Credits: 'credit-card',
  Subzone: 'map-marker',
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.subtle,
  },
  scene: {
    backgroundColor: colors.background.subtle,
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
});

const nestedStackScreenOptions = {
  headerShown: false,
  freezeOnBlur: false,
  contentStyle: styles.scene,
} as const;

function tabBarHiddenOnNested(
  route: { name?: string; state?: unknown },
  homeRouteName: string,
  defaultTabBarStyle: object,
) {
  const focusedRoute = getFocusedRouteNameFromRoute(route) ?? homeRouteName;
  return focusedRoute === homeRouteName
    ? defaultTabBarStyle
    : { display: 'none' as const };
}

function AdminUsersStack(): React.ReactElement {
  return (
    <UsersStack.Navigator screenOptions={nestedStackScreenOptions}>
      <UsersStack.Screen name="UsersHome" component={AdminUsersScreen} />
      <UsersStack.Screen name="UserDetail" component={AdminUserDetailScreen} />
    </UsersStack.Navigator>
  );
}

function AdminTripsStack(): React.ReactElement {
  return (
    <TripsStack.Navigator screenOptions={nestedStackScreenOptions}>
      <TripsStack.Screen name="TripsHome" component={AdminTripsScreen} />
      <TripsStack.Screen name="ListingDetail" component={ListingDetailScreen} />
    </TripsStack.Navigator>
  );
}

function AdminCreditsStack(): React.ReactElement {
  return (
    <CreditsStack.Navigator screenOptions={nestedStackScreenOptions}>
      <CreditsStack.Screen name="CreditsHome" component={AdminCreditsScreen} />
      <CreditsStack.Screen name="CreditSettings" component={AdminCreditSettingsScreen} />
      <CreditsStack.Screen name="CreditPurchaseRequests" component={AdminCreditPurchaseListScreen} />
      <CreditsStack.Screen name="CreditPurchaseDetail" component={AdminCreditPurchaseDetailScreen} />
    </CreditsStack.Navigator>
  );
}

function AdminTabs(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + insets.bottom + TAB_BAR_EXTRA;
  const defaultTabBarStyle = React.useMemo(
    () => [styles.tabBar, { height: tabBarHeight, paddingBottom: insets.bottom }],
    [insets.bottom, tabBarHeight],
  );

  return (
    <View style={styles.root} collapsable={false}>
      <Tab.Navigator
        initialRouteName="Home"
        safeAreaInsets={{ top: 0 }}
        screenOptions={{
          headerShown: false,
          lazy: false,
          freezeOnBlur: false,
          tabBarHideOnKeyboard: true,
          sceneStyle: styles.scene,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarLabelPosition: 'below-icon',
          tabBarIconStyle: styles.tabIcon,
          tabBarItemStyle: styles.tabItem,
          tabBarStyle: defaultTabBarStyle,
        }}
      >
        <Tab.Screen
          name="Home"
          component={AdminHomeScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome name={TAB_ICONS.Home} size={22} color={color} />
            ),
            tabBarLabel: ({ color }) => <AdminTabLabel routeName="Home" color={color} />,
          }}
        />
        <Tab.Screen
          name="Users"
          component={AdminUsersStack}
          options={({ route }) => ({
            tabBarIcon: ({ color }) => (
              <FontAwesome name={TAB_ICONS.Users} size={22} color={color} />
            ),
            tabBarLabel: ({ color }) => <AdminTabLabel routeName="Users" color={color} />,
            tabBarStyle: tabBarHiddenOnNested(route, 'UsersHome', defaultTabBarStyle),
          })}
        />
        <Tab.Screen
          name="Trips"
          component={AdminTripsStack}
          options={({ route }) => ({
            tabBarIcon: ({ color }) => (
              <FontAwesome name={TAB_ICONS.Trips} size={22} color={color} />
            ),
            tabBarLabel: ({ color }) => <AdminTabLabel routeName="Trips" color={color} />,
            tabBarStyle: tabBarHiddenOnNested(route, 'TripsHome', defaultTabBarStyle),
          })}
        />
        <Tab.Screen
          name="Credits"
          component={AdminCreditsStack}
          options={({ route }) => ({
            tabBarIcon: ({ color }) => (
              <FontAwesome name={TAB_ICONS.Credits} size={22} color={color} />
            ),
            tabBarLabel: ({ color }) => <AdminTabLabel routeName="Credits" color={color} />,
            tabBarStyle: tabBarHiddenOnNested(route, 'CreditsHome', defaultTabBarStyle),
          })}
        />
        <Tab.Screen
          name="Subzone"
          component={AdminSubzoneScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome name={TAB_ICONS.Subzone} size={22} color={color} />
            ),
            tabBarLabel: ({ color }) => <AdminTabLabel routeName="Subzone" color={color} />,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStackNavigator}
          options={({ route }) => ({
            tabBarIcon: ({ color }) => (
              <FontAwesome name="cog" size={22} color={color} />
            ),
            tabBarLabel: ({ color }) => <AdminTabLabel routeName="Settings" color={color} />,
            tabBarStyle: tabBarHiddenOnNested(route, 'SettingsHome', defaultTabBarStyle),
          })}
          listeners={({ navigation }) => ({
            tabPress: () => {
              const settingsRoute = navigation
                .getState()
                .routes.find(
                  (tabRoute: { name: string; state?: { index?: number; key?: string } }) =>
                    tabRoute.name === 'Settings',
                );
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
    </View>
  );
}

export function AdminNavigator(): React.ReactElement {
  return (
    <TripProvider>
      <AdminTabs />
    </TripProvider>
  );
}
