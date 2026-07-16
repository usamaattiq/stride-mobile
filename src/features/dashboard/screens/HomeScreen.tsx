import React from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { colors } from '@/theme';

import { HomeFeedPanel } from '../components/HomeFeedPanel';
import { HomeHeader } from '../components/HomeHeader';
import { MessagesPanel } from '../components/MessagesPanel';
import { NotificationsPanel } from '../components/NotificationsPanel';
import { DEMO_HOME_USER } from '../constants/messages';
import type { DashboardTabParamList, HomePanel } from '../navigation/types';

/**
 * Persistent header + bottom tabs. Middle content swaps via local `panel`
 * state (same pattern as auth multi-step flows — no stack pushes).
 */
export function HomeScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<BottomTabNavigationProp<DashboardTabParamList, 'Home'>>();
  const [panel, setPanel] = React.useState<HomePanel>('feed');

  const showMessages = React.useCallback(() => setPanel('messages'), []);
  const showNotifications = React.useCallback(() => setPanel('notifications'), []);

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
    const unsubscribe = navigation.addListener('tabPress', () => {
      setPanel('feed');
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <HomeHeader
        firstName={DEMO_HOME_USER.firstName}
        roleLabel={t(DEMO_HOME_USER.roleKey)}
        avatarUri={DEMO_HOME_USER.avatarUri}
        credits={DEMO_HOME_USER.credits}
        notificationCount={DEMO_HOME_USER.notificationCount}
        hasUnreadMessages={DEMO_HOME_USER.hasUnreadMessages}
        onChatPress={showMessages}
        onNotificationsPress={showNotifications}
      />

      <View style={styles.body}>
        {panel === 'feed' ? <HomeFeedPanel /> : null}
        {panel === 'messages' ? <MessagesPanel /> : null}
        {panel === 'notifications' ? <NotificationsPanel /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  body: {
    flex: 1,
  },
});
