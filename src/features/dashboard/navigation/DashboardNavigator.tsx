import React from 'react';
import { StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { colors } from '@/theme';
import { getFontFamily } from '@/theme/typography';

import { HomeScreen } from '../screens/HomeScreen';
import { MyListingsScreen } from '../screens/MyListingsScreen';
import { MyOffersScreen } from '../screens/MyOffersScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { DashboardTabParamList } from './types';

const Tab = createBottomTabNavigator<DashboardTabParamList>();

type TabIconName = React.ComponentProps<typeof FontAwesome>['name'];

const TAB_ICONS: Record<keyof DashboardTabParamList, TabIconName> = {
  Home: 'home',
  MyListings: 'list-alt',
  MyOffers: 'tags',
  Settings: 'cog',
};

/** Content area for icon + label (library adds bottom inset on top of this). */
const TAB_BAR_CONTENT_HEIGHT = 64;

export function DashboardNavigator(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarLabel: t(`dashboard.tabs.${route.name}`),
        tabBarLabelStyle: [
          styles.tabLabel,
          { fontFamily: getFontFamily(currentLanguage, 'medium') },
        ],
        tabBarIconStyle: styles.tabIcon,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: [
          styles.tabBar,
          { height: TAB_BAR_CONTENT_HEIGHT + insets.bottom },
        ],
        tabBarIcon: ({ color }) => (
          <FontAwesome name={TAB_ICONS[route.name]} size={22} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="MyListings" component={MyListingsScreen} />
      <Tab.Screen name="MyOffers" component={MyOffersScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
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
