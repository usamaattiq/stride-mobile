import React from 'react';
import type { RefreshControlProps } from 'react-native';

import { colors } from '@/theme';

/**
 * Shared pull-to-refresh props for list / scroll screens.
 * Spread into `<RefreshControl {...refreshControlProps} />`.
 * `refresh` may reject; failures are swallowed so the spinner always clears.
 */
export function usePullToRefresh(refresh: () => Promise<unknown>): {
  refreshing: boolean;
  onRefresh: () => void;
  refreshControlProps: RefreshControlProps;
} {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    void Promise.resolve(refresh())
      .catch(() => undefined)
      .finally(() => setRefreshing(false));
  }, [refresh]);

  const refreshControlProps = React.useMemo<RefreshControlProps>(
    () => ({
      refreshing,
      onRefresh,
      tintColor: colors.primary,
      colors: [colors.primary],
      progressBackgroundColor: colors.white,
    }),
    [onRefresh, refreshing],
  );

  return { refreshing, onRefresh, refreshControlProps };
}
