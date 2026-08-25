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

import { AdminCreditsScreen } from '../screens/AdminCreditsScreen';
import { AdminSubzoneScreen } from '../screens/AdminSubzoneScreen';
import { AdminTripsScreen } from '../screens/AdminTripsScreen';
import { AdminUserDetailScreen } from '../screens/AdminUserDetailScreen';
import { AdminUsersScreen } from '../screens/AdminUsersScreen';
import { AdminTabLabel } from './AdminTabLabel';
import type { AdminRootStackParamList, AdminTabParamList } from './adminNavigationTypes';

const Tab = createBottomTabNavigator<AdminTabParamList>();
const RootStack = createNativeStackNavigator<AdminRootStackParamList>();

const TAB_BAR_CONTENT_HEIGHT = 64;
const TAB_BAR_EXTRA = 12;

const TAB_ICONS: Record<
  Exclude<keyof AdminTabParamList, 'Settings'>,
  React.ComponentProps<typeof FontAwesome>['name']
> = {
  Users: 'users',
  Trips: 'map',
  Credits: 'credit-card',
  Subzone: 'map-marker',
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scene: {
    backgroundColor: colors.primary,
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

function AdminTabs(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + insets.bottom + TAB_BAR_EXTRA;
  const defaultTabBarStyle = React.useMemo(
    () => [styles.tabBar, { height: tabBarHeight, paddingBottom: insets.bottom }],
    [insets.bottom, tabBarHeight],
  );

  return (
    <View style={styles.root}>
      <Tab.Navigator
        safeAreaInsets={{ top: 0 }}
        screenOptions={{
          headerShown: false,
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
          name="Users"
          component={AdminUsersScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome name={TAB_ICONS.Users} size={22} color={color} />
            ),
            tabBarLabel: ({ color }) => <AdminTabLabel routeName="Users" color={color} />,
          }}
        />
        <Tab.Screen
          name="Trips"
          component={AdminTripsScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome name={TAB_ICONS.Trips} size={22} color={color} />
            ),
            tabBarLabel: ({ color }) => <AdminTabLabel routeName="Trips" color={color} />,
          }}
        />
        <Tab.Screen
          name="Credits"
          component={AdminCreditsScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome name={TAB_ICONS.Credits} size={22} color={color} />
            ),
            tabBarLabel: ({ color }) => <AdminTabLabel routeName="Credits" color={color} />,
          }}
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
          options={({ route }) => {
            const focusedRoute = getFocusedRouteNameFromRoute(route) ?? 'SettingsHome';
            return {
              tabBarIcon: ({ color }) => (
                <FontAwesome name="cog" size={22} color={color} />
              ),
              tabBarLabel: ({ color }) => <AdminTabLabel routeName="Settings" color={color} />,
              tabBarStyle:
                focusedRoute === 'SettingsHome'
                  ? defaultTabBarStyle
                  : { display: 'none' },
            };
          }}
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
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: styles.scene,
        }}
      >
        <RootStack.Screen name="MainTabs" component={AdminTabs} />
        <RootStack.Screen name="ListingDetail" component={ListingDetailScreen} />
        <RootStack.Screen name="UserDetail" component={AdminUserDetailScreen} />
      </RootStack.Navigator>
    </TripProvider>
  );
}
