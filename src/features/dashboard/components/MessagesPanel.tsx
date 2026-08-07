import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { chatApi } from '@/services/api/chatApi';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppText } from '@/shared/components/AppText';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { colors, spacing } from '@/theme';

import { DashboardSearchBar } from './DashboardSearchBar';
import { MessageCard } from './MessageCard';
import { MessageFilterTabs } from './MessageFilterTabs';
import { MessageLegend } from './MessageLegend';
import { MessagesEmptyState } from './MessagesEmptyState';
import { TripMessagingSheet } from './trip/TripMessagingSheet';
import type { HomeMessage, MessageFilter } from '../types/messages.types';
import { mapInboxItemToHomeMessage } from '../utils/mapInboxItemToHomeMessage';

export const MessagesPanel = React.memo(function MessagesPanel(): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<MessageFilter>('all');
  const [messages, setMessages] = React.useState<HomeMessage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeChat, setActiveChat] = React.useState<HomeMessage | null>(null);

  const loadInbox = React.useCallback(async () => {
    try {
      const inbox = await chatApi.listInbox();
      setMessages(inbox.map((item) => mapInboxItemToHomeMessage(item, t, i18n.language)));
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, t('dashboard.messages.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [i18n.language, t]);

  React.useEffect(() => {
    setLoading(true);
    void loadInbox();
  }, [loadInbox]);

  const { refreshControlProps } = usePullToRefresh(loadInbox);

  const unreadCount = React.useMemo(
    () => messages.filter((message) => message.unread).length,
    [messages],
  );

  const visibleMessages = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return messages.filter((message) => {
      if (filter === 'unread' && !message.unread) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        message.senderName.toLowerCase().includes(normalizedQuery) ||
        message.preview.toLowerCase().includes(normalizedQuery) ||
        message.context.title.toLowerCase().includes(normalizedQuery) ||
        message.context.subtitle.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [filter, messages, query]);

  const listHeader = (
    <View style={styles.listHeader}>
      <DashboardSearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t('dashboard.messages.searchPlaceholder')}
      />
      <MessageFilterTabs
        active={filter}
        allCount={messages.length}
        unreadCount={unreadCount}
        onChange={setFilter}
      />
      {error ? (
        <AppText style={styles.errorText}>{error}</AppText>
      ) : null}
    </View>
  );

  const renderItem = React.useCallback(
    ({ item }: { item: HomeMessage }) => (
      <MessageCard message={item} onPress={setActiveChat} />
    ),
    [],
  );

  const closeChat = React.useCallback(() => {
    setActiveChat(null);
    void loadInbox();
  }, [loadInbox]);

  return (
    <>
      <FlatList
        data={visibleMessages}
        keyExtractor={messageKeyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <MessagesEmptyState />
          )
        }
        ListFooterComponent={visibleMessages.length > 0 ? <MessageLegend /> : null}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={MessageSeparator}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl {...refreshControlProps} />}
        removeClippedSubviews
        initialNumToRender={6}
        windowSize={7}
      />

      <TripMessagingSheet
        visible={activeChat != null}
        onClose={closeChat}
        tripId={activeChat?.tripId ?? ''}
        counterpartyId={activeChat?.counterpartyId}
        counterpartyName={activeChat?.senderName ?? null}
        offerId={activeChat?.offerId ?? undefined}
      />
    </>
  );
});

function messageKeyExtractor(item: HomeMessage): string {
  return item.id;
}

function MessageSeparator(): React.ReactElement {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.background.subtle,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  listHeader: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  separator: {
    height: spacing.sm,
  },
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: colors.primary,
  },
});
