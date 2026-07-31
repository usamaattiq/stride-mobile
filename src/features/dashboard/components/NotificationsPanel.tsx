import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import { DEMO_NOTIFICATIONS } from '../constants/notifications';
import type { AppNotification } from '../types/notifications.types';

export const NotificationsPanel = React.memo(
  function NotificationsPanel(): React.ReactElement {
    const { t } = useTranslation(undefined, { i18n: appI18n });

    const renderItem = React.useCallback(
      ({ item }: { item: AppNotification }) => (
        <NotificationRow notification={item} />
      ),
      [],
    );

    return (
      <FlatList
        data={DEMO_NOTIFICATIONS}
        keyExtractor={notificationKeyExtractor}
        ListHeaderComponent={null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppText weight="semibold" style={styles.emptyTitle}>
              {t('dashboard.notifications.emptyTitle')}
            </AppText>
            <AppText style={styles.emptySubtitle}>
              {t('dashboard.notifications.emptySubtitle')}
            </AppText>
          </View>
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={NotificationSeparator}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={8}
        windowSize={7}
      />
    );
  },
);

function notificationKeyExtractor(item: AppNotification): string {
  return item.id;
}

const NotificationRow = React.memo(function NotificationRow({
  notification,
}: {
  notification: AppNotification;
}): React.ReactElement {
  const iconName =
    notification.kind === 'offer'
      ? 'tags'
      : notification.kind === 'booking'
        ? 'calendar-check'
        : 'bell';

  return (
    <View style={[styles.card, notification.unread && styles.cardUnread]}>
      <View style={styles.iconWrap}>
        <FontAwesome5 name={iconName} size={14} color={colors.primary} solid />
      </View>
      <View style={styles.copy}>
        <View style={styles.cardHeader}>
          <AppText weight="bold" style={styles.cardTitle} numberOfLines={1}>
            {notification.title}
          </AppText>
          <AppText style={styles.time}>{notification.timeLabel}</AppText>
        </View>
        <AppText style={styles.body} numberOfLines={2}>
          {notification.body}
        </AppText>
      </View>
      {notification.unread ? <View style={styles.unreadDot} /> : null}
    </View>
  );
});

function NotificationSeparator(): React.ReactElement {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
  },
  cardUnread: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryMuted,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  time: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  separator: {
    height: spacing.xs,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
