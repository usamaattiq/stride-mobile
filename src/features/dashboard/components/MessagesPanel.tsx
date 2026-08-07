import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
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

import { MessageCard } from './MessageCard';
import { MessagesEmptyState } from './MessagesEmptyState';
import { TripMessagingSheet } from './trip/TripMessagingSheet';
import { useDashboardSession } from '../context/DashboardSessionContext';
import type { HomeMessage, MessageFilter } from '../types/messages.types';
import { mapInboxItemToHomeMessage } from '../utils/mapInboxItemToHomeMessage';

const MESSAGE_FILTERS: MessageFilter[] = ['all', 'unread'];
const INITIAL_PAGE_WIDTH = Dimensions.get('window').width;

export type MessagesPanelHandle = {
  selectFilter: (filter: MessageFilter, animated?: boolean) => void;
};

type MessagesPanelProps = {
  filter: MessageFilter;
  onFilterChange: (filter: MessageFilter) => void;
  onAnimatedIndexChange?: (
    animatedIndex: Animated.AnimatedInterpolation<number> | undefined,
  ) => void;
};

export const MessagesPanel = React.memo(
  React.forwardRef<MessagesPanelHandle, MessagesPanelProps>(function MessagesPanel(
    { filter, onFilterChange, onAnimatedIndexChange },
    ref,
  ): React.ReactElement {
    const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
    const { user, setHasUnreadMessages } = useDashboardSession();
    const [messages, setMessages] = React.useState<HomeMessage[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [activeChat, setActiveChat] = React.useState<HomeMessage | null>(null);
    const [pageWidth, setPageWidth] = React.useState(INITIAL_PAGE_WIDTH);
    const pagerRef = React.useRef<ScrollView>(null);
    const scrollX = React.useRef(new Animated.Value(0)).current;

    const loadInbox = React.useCallback(async () => {
      try {
        // API scopes by JWT role (passenger vs driver activity).
        const inbox = await chatApi.listInbox();
        const newestFirst = [...inbox].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        setMessages((prev) => {
          const prevById = new Map(prev.map((row) => [row.id, row]));
          return newestFirst.map((item) => {
            const mapped = mapInboxItemToHomeMessage(item, t, i18n.language);
            const existing = prevById.get(mapped.id);
            // Keep prior avatar URI so signed URL refreshes don't flash-reload images.
            if (existing?.avatar.imageUri && mapped.avatar.imageUri) {
              return {
                ...mapped,
                avatar: { ...mapped.avatar, imageUri: existing.avatar.imageUri },
              };
            }
            return mapped;
          });
        });
        setHasUnreadMessages(newestFirst.some((item) => item.unread));
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err, t('dashboard.messages.loadFailed')));
      } finally {
        setLoading(false);
      }
    }, [i18n.language, setHasUnreadMessages, t]);

    React.useEffect(() => {
      setLoading(true);
      setMessages([]);
      void loadInbox();
    }, [loadInbox, user.role]);

    const { refreshControlProps } = usePullToRefresh(loadInbox);

    const selectFilter = React.useCallback(
      (next: MessageFilter, animated = true) => {
        onFilterChange(next);
        if (pageWidth <= 0) {
          return;
        }
        const index = MESSAGE_FILTERS.indexOf(next);
        pagerRef.current?.scrollTo({ x: index * pageWidth, animated });
        if (!animated) {
          scrollX.setValue(index * pageWidth);
        }
      },
      [onFilterChange, pageWidth, scrollX],
    );

    React.useImperativeHandle(ref, () => ({ selectFilter }), [selectFilter]);

    const animatedFilterIndex = React.useMemo(() => {
      if (pageWidth <= 0) {
        return undefined;
      }
      return scrollX.interpolate({
        inputRange: [0, pageWidth],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      });
    }, [pageWidth, scrollX]);

    React.useEffect(() => {
      onAnimatedIndexChange?.(animatedFilterIndex);
    }, [animatedFilterIndex, onAnimatedIndexChange]);

    const syncFilterFromOffset = React.useCallback(
      (offsetX: number) => {
        if (pageWidth <= 0) {
          return;
        }
        const index = Math.round(offsetX / pageWidth);
        const nextFilter =
          MESSAGE_FILTERS[Math.min(Math.max(index, 0), MESSAGE_FILTERS.length - 1)];
        onFilterChange(nextFilter);
      },
      [onFilterChange, pageWidth],
    );

    const onPagerScrollEnd = React.useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        syncFilterFromOffset(event.nativeEvent.contentOffset.x);
      },
      [syncFilterFromOffset],
    );

    const onPagerLayout = React.useCallback(
      (event: LayoutChangeEvent) => {
        const width = event.nativeEvent.layout.width;
        if (width <= 0 || width === pageWidth) {
          return;
        }
        setPageWidth(width);
        const index = MESSAGE_FILTERS.indexOf(filter);
        scrollX.setValue(index * width);
        requestAnimationFrame(() => {
          pagerRef.current?.scrollTo({ x: index * width, animated: false });
        });
      },
      [filter, pageWidth, scrollX],
    );

    const messagesByFilter = React.useMemo(
      () => ({
        all: messages,
        unread: messages.filter((message) => message.unread),
      }),
      [messages],
    );

    const renderItem = React.useCallback(
      ({ item }: { item: HomeMessage }) => (
        <MessageCard message={item} onPress={setActiveChat} />
      ),
      [],
    );

    const closeChat = React.useCallback(() => {
      const closedId = activeChat?.id;
      setActiveChat(null);
      // Opening the thread marks messages read — update locally, don't refetch inbox.
      if (!closedId) {
        return;
      }
      setHasUnreadMessages(
        messages.some((row) => row.unread && row.id !== closedId),
      );
      setMessages((prev) =>
        prev.map((row) =>
          row.id === closedId && row.unread ? { ...row, unread: false } : row,
        ),
      );
    }, [activeChat?.id, messages, setHasUnreadMessages]);

    const renderFilterPage = (pageFilter: MessageFilter, width: number): React.ReactElement => {
      const pageMessages = messagesByFilter[pageFilter];

      let pageBody: React.ReactElement;
      if (loading) {
        pageBody = (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        );
      } else if (pageMessages.length === 0) {
        pageBody = (
          <ScrollView
            contentContainerStyle={styles.emptyScroll}
            refreshControl={<RefreshControl {...refreshControlProps} />}
            showsVerticalScrollIndicator={false}
          >
            <MessagesEmptyState />
          </ScrollView>
        );
      } else {
        pageBody = (
          <FlatList
            data={pageMessages}
            keyExtractor={messageKeyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={MessageSeparator}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl {...refreshControlProps} />}
            removeClippedSubviews
            initialNumToRender={6}
            windowSize={7}
          />
        );
      }

      return (
        <View key={pageFilter} style={[styles.page, { width }]}>
          {pageBody}
        </View>
      );
    };

    return (
      <>
        <View style={styles.root}>
          {error ? (
            <AppText style={styles.errorText}>{error}</AppText>
          ) : null}

          <View style={styles.pager} onLayout={onPagerLayout}>
            <Animated.ScrollView
              ref={pagerRef}
              horizontal
              pagingEnabled
              bounces={false}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                useNativeDriver: true,
              })}
              onScrollEndDrag={onPagerScrollEnd}
              onMomentumScrollEnd={onPagerScrollEnd}
              scrollEventThrottle={16}
            >
              {MESSAGE_FILTERS.map((pageFilter) => renderFilterPage(pageFilter, pageWidth))}
            </Animated.ScrollView>
          </View>
        </View>

        <TripMessagingSheet
          visible={activeChat != null}
          onClose={closeChat}
          tripId={activeChat?.tripId ?? ''}
          counterpartyId={activeChat?.counterpartyId}
          counterpartyName={activeChat?.senderName ?? null}
          counterpartyAvatarUrl={activeChat?.avatar.imageUri ?? null}
          counterpartyRole={activeChat?.counterpartyRole ?? null}
          offerId={activeChat?.offerId ?? undefined}
        />
      </>
    );
  }),
);

function messageKeyExtractor(item: HomeMessage): string {
  return item.id;
}

function MessageSeparator(): React.ReactElement {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.subtle,
  },
  pager: {
    flex: 1,
    overflow: 'hidden',
  },
  page: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  emptyScroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
});
