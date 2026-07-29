import React from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { colors, spacing } from '@/theme';

import { HomeFeedPanel } from '../components/HomeFeedPanel';
import { HomeHeader } from '../components/HomeHeader';
import { MessagesPanel } from '../components/MessagesPanel';
import { NotificationsPanel } from '../components/NotificationsPanel';
import { PassengerSearchPanel } from '../components/PassengerSearchPanel';
import { useDashboardSession } from '../context/DashboardSessionContext';
import type { DashboardTabParamList, HomePanel, HomeStackParamList } from '../navigation/types';

type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>,
  BottomTabNavigationProp<DashboardTabParamList, 'Home'>
>;

/**
 * Persistent header + bottom tabs. Middle content swaps via local `panel`
 * state (same pattern as auth multi-step flows — no stack pushes).
 */
export function HomeScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { user } = useDashboardSession();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [panel, setPanel] = React.useState<HomePanel>('feed');

  const isPassenger = user.role === 'passenger';
  const showPanelChrome = panel === 'messages' || panel === 'notifications';

  const showMessages = React.useCallback(() => setPanel('messages'), []);
  const showNotifications = React.useCallback(() => setPanel('notifications'), []);
  const goToSettings = React.useCallback(() => {
    navigation
      .getParent<BottomTabNavigationProp<DashboardTabParamList, 'Home'>>()
      ?.navigate({ name: 'Settings', params: { screen: 'SettingsHome' } });
  }, [navigation]);

  const roleLabel =
    user.role === 'driver'
      ? t('profile.roles.driver')
      : t('profile.roles.passenger');

  const panelTitle =
    panel === 'messages'
      ? t('dashboard.messages.title')
      : panel === 'notifications'
        ? t('dashboard.notifications.title')
        : null;

  const panelSubtitle =
    panel === 'messages'
      ? t('dashboard.messages.subtitle')
      : panel === 'notifications'
        ? t('dashboard.notifications.subtitle')
        : null;

  useFocusEffect(
    React.useCallback(() => {
      const onHardwareBack = () => {
        if (panel !== 'feed') {
          setPanel('feed');
          return true;
        }
        return false;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [panel]),
  );

  React.useEffect(() => {
    const tabNavigation = navigation.getParent<BottomTabNavigationProp<DashboardTabParamList, 'Home'>>();
    if (!tabNavigation) {
      return;
    }

    const unsubscribe = tabNavigation.addListener('tabPress', () => {
      setPanel('feed');
      const homeStackState = navigation.getState();
      if (homeStackState.index > 0) {
        navigation.navigate('HomeMain');
      }
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar style="light" />
      <HomeHeader
        firstName={user.firstName}
        roleLabel={roleLabel}
        avatarUri={user.avatarUri}
        credits={user.credits}
        notificationCount={user.notificationCount}
        hasUnreadMessages={user.hasUnreadMessages}
        variant="onBrand"
        onChatPress={showMessages}
        onNotificationsPress={showNotifications}
        onProfilePress={goToSettings}
      />

      {showPanelChrome && panelTitle ? (
        <View style={styles.panelHeader}>
          <AppText weight="bold" style={styles.panelTitle} numberOfLines={1}>
            {panelTitle}
          </AppText>
          {panelSubtitle ? (
            <AppText style={styles.panelSubtitle} numberOfLines={2}>
              {panelSubtitle}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.body, showPanelChrome && styles.bodyCurved]}>
        {panel === 'feed' ? (
          isPassenger ? <PassengerSearchPanel /> : <HomeFeedPanel />
        ) : null}
        {panel === 'messages' ? <MessagesPanel /> : null}
        {panel === 'notifications' ? <NotificationsPanel /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  panelHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  panelTitle: {
    fontSize: 22,
    lineHeight: 28,
    color: colors.white,
  },
  panelSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.onBrandMuted,
  },
  body: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  bodyCurved: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -18,
    overflow: 'hidden',
  },
});
