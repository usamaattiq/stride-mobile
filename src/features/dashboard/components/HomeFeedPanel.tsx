import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { PromoAdBanner } from './PromoAdBanner';
import { RequestCategoryChips } from './RequestCategoryChips';
import { RequestSearchRow } from './RequestSearchRow';
import { RequestsEmptyState } from './RequestsEmptyState';
import { ReverseRequestCard } from './ReverseRequestCard';
import { ReverseRequestsBanner } from './ReverseRequestsBanner';
import { SHOW_DEMO_DASHBOARD_DATA } from '../constants/demo';
import { DEMO_REVERSE_REQUESTS } from '../constants/requests';
import type { HomeFeedItem, RequestCategory } from '../types/requests.types';

export const HomeFeedPanel = React.memo(function HomeFeedPanel(): React.ReactElement {
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState<RequestCategory>('all');
  const [hiddenAds, setHiddenAds] = React.useState<Record<string, boolean>>({});

  const hideAd = React.useCallback((id: string) => {
    setHiddenAds((current) => ({ ...current, [id]: true }));
  }, []);

  const feedItems = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return DEMO_REVERSE_REQUESTS.filter((item) => {
      if (item.type === 'ad') {
        return !hiddenAds[item.id];
      }

      if (category !== 'all') {
        if (category === 'rfq' || category === 'auction') {
          if (!item.data.kinds.includes(category)) {
            return false;
          }
        } else if (item.data.category !== category) {
          return false;
        }
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        item.data.fromCity,
        item.data.toCity,
        item.data.fromArea,
        item.data.toArea,
        item.data.vehicle,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [category, hiddenAds, query]);

  const listHeader = (
    <View style={styles.listHeader}>
      <ReverseRequestsBanner />
      <RequestSearchRow
        query={query}
        onChangeQuery={setQuery}
        filterCount={SHOW_DEMO_DASHBOARD_DATA ? 2 : 0}
      />
      <RequestCategoryChips active={category} onChange={setCategory} />
    </View>
  );

  const renderItem = React.useCallback(
    ({ item }: { item: HomeFeedItem }) => <FeedRow item={item} onHideAd={hideAd} />,
    [hideAd],
  );

  return (
    <FlatList
      data={feedItems}
      keyExtractor={feedKeyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={<RequestsEmptyState />}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={FeedSeparator}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews
      initialNumToRender={4}
      windowSize={7}
    />
  );
});

function feedKeyExtractor(item: HomeFeedItem): string {
  return item.type === 'ad' ? item.id : item.data.id;
}

type FeedRowProps = {
  item: HomeFeedItem;
  onHideAd: (id: string) => void;
};

const FeedRow = React.memo(function FeedRow({
  item,
  onHideAd,
}: FeedRowProps): React.ReactElement {
  if (item.type === 'ad') {
    return <PromoAdBanner onClose={() => onHideAd(item.id)} />;
  }

  return <ReverseRequestCard request={item.data} />;
});

function FeedSeparator(): React.ReactElement {
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
  separator: {
    height: spacing.sm,
  },
});
