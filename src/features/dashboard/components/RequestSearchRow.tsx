import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import { DashboardSearchBar } from './DashboardSearchBar';

type RequestSearchRowProps = {
  query: string;
  onChangeQuery: (value: string) => void;
  filterCount?: number;
  onFilterPress?: () => void;
};

export function RequestSearchRow({
  query,
  onChangeQuery,
  filterCount = 0,
  onFilterPress,
}: RequestSearchRowProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <View style={styles.root}>
      <View style={styles.searchWrap}>
        <DashboardSearchBar
          value={query}
          onChangeText={onChangeQuery}
          placeholder={t('dashboard.home.requestSearchPlaceholder')}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.home.filterA11y')}
        onPress={onFilterPress}
        style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}
      >
        <FontAwesome name="sliders" size={14} color={colors.text.primary} />
        <AppText weight="medium" style={styles.filterLabel}>
          {t('dashboard.home.filter')}
        </AppText>
        {filterCount > 0 ? (
          <View style={styles.badge}>
            <AppText weight="bold" style={styles.badgeText}>
              {String(filterCount)}
            </AppText>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  searchWrap: {
    flex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  filterLabel: {
    fontSize: 12,
    color: colors.text.primary,
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    color: colors.white,
    lineHeight: 11,
  },
  pressed: {
    opacity: 0.85,
  },
});
