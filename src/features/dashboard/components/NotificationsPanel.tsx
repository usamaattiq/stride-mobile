import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { notificationsApi, type InboxNotificationDto } from '@/services/api/notificationsApi';
import { getErrorMessage } from '@/services/api/errorMessage';
import { handlePingDeepLink } from '@/services/pingDeepLinkRouting';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import type { AppNotification } from '../types/notifications.types';

function formatRelativeTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) {
    return 'now';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.round(hours / 24);
  if (days < 7) {
    return `${days}d`;
  }
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

function mapInboxItem(item: InboxNotificationDto, locale: string): AppNotification {
  const kindRaw = item.data && typeof item.data.kind === 'string' ? item.data.kind : 'system';
  const kind: AppNotification['kind'] =
    kindRaw.includes('offer') || kindRaw.includes('bid') || kindRaw.includes('rfq')
      ? 'offer'
      : kindRaw.includes('confirm') || kindRaw.includes('booking')
        ? 'booking'
        : 'system';

  return {
    id: item.id,
    title: item.title,
    body: item.body,
    timeLabel: formatRelativeTime(item.createdAt, locale),
    unread: !item.isRead,
    kind,
    deepLink: item.deepLink,
  };
}

export const NotificationsPanel = React.memo(function NotificationsPanel(): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const [items, setItems] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationsApi.listInbox({ limit: 50 });
      setItems(result.items.map((row) => mapInboxItem(row, i18n.language)));
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, t('dashboard.notifications.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [i18n.language, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onPress = React.useCallback(async (notification: AppNotification) => {
    if (notification.unread) {
      void notificationsApi.markRead(notification.id).catch(() => undefined);
      setItems((prev) =>
        prev.map((row) => (row.id === notification.id ? { ...row, unread: false } : row)),
      );
    }
    if (notification.deepLink) {
      handlePingDeepLink(notification.deepLink);
    }
  }, []);

  const renderItem = React.useCallback(
    ({ item }: { item: AppNotification }) => (
      <NotificationRow notification={item} onPress={onPress} />
    ),
    [onPress],
  );

  return (
    <FlatList
      data={items}
      keyExtractor={notificationKeyExtractor}
      ListHeaderComponent={null}
      ListEmptyComponent={
        loading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <AppText weight="semibold" style={styles.emptyTitle}>
              {error}
            </AppText>
          </View>
        ) : (
          <View style={styles.empty}>
            <AppText weight="semibold" style={styles.emptyTitle}>
              {t('dashboard.notifications.emptyTitle')}
            </AppText>
            <AppText style={styles.emptySubtitle}>
              {t('dashboard.notifications.emptySubtitle')}
            </AppText>
          </View>
        )
      }
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={NotificationSeparator}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      initialNumToRender={8}
      windowSize={7}
      refreshing={loading}
      onRefresh={() => {
        void load();
      }}
    />
  );
});

function notificationKeyExtractor(item: AppNotification): string {
  return item.id;
}

const NotificationRow = React.memo(function NotificationRow({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: (item: AppNotification) => void;
}): React.ReactElement {
  const iconName =
    notification.kind === 'offer'
      ? 'tags'
      : notification.kind === 'booking'
        ? 'calendar-check'
        : 'bell';

  return (
    <Pressable
      onPress={() => onPress(notification)}
      style={({ pressed }) => [styles.card, notification.unread && styles.cardUnread, pressed && styles.pressed]}
    >
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
    </Pressable>
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
  pressed: {
    opacity: 0.85,
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
