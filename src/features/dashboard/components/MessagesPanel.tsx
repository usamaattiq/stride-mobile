import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, spacing } from '@/theme';

import { DashboardSearchBar } from './DashboardSearchBar';
import { MessageCard } from './MessageCard';
import { MessageFilterTabs } from './MessageFilterTabs';
import { MessageLegend } from './MessageLegend';
import { MessagesEmptyState } from './MessagesEmptyState';
import { DEMO_HOME_MESSAGES } from '../constants/messages';
import type { HomeMessage, MessageFilter } from '../types/messages.types';

export const MessagesPanel = React.memo(function MessagesPanel(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<MessageFilter>('all');

  const unreadCount = React.useMemo(
    () => DEMO_HOME_MESSAGES.filter((message) => message.unread).length,
    [],
  );

  const visibleMessages = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return DEMO_HOME_MESSAGES.filter((message) => {
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
  }, [filter, query]);

  const listHeader = (
    <View style={styles.listHeader}>
      <AppText weight="bold" style={styles.title}>
        {t('dashboard.messages.title')}
      </AppText>
      <DashboardSearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t('dashboard.messages.searchPlaceholder')}
      />
      <MessageFilterTabs
        active={filter}
        allCount={DEMO_HOME_MESSAGES.length}
        unreadCount={unreadCount}
        onChange={setFilter}
      />
    </View>
  );

  const renderItem = React.useCallback(
    ({ item }: { item: HomeMessage }) => <MessageCard message={item} />,
    [],
  );

  return (
    <FlatList
      data={visibleMessages}
      keyExtractor={messageKeyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={<MessagesEmptyState />}
      ListFooterComponent={visibleMessages.length > 0 ? <MessageLegend /> : null}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={MessageSeparator}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews
      initialNumToRender={6}
      windowSize={7}
    />
  );
});

function messageKeyExtractor(item: HomeMessage): string {
  return item.id;
}

function MessageSeparator(): React.ReactElement {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  listHeader: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    color: colors.text.primary,
  },
  separator: {
    height: spacing.xs,
  },
});
