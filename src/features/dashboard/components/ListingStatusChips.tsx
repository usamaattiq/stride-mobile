import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import type { ListingStatusFilter } from '../utils/listingFilters';

type ListingStatusChipsProps = {
  active: ListingStatusFilter;
  onChange: (status: ListingStatusFilter) => void;
};

const OPTIONS: { id: ListingStatusFilter; labelKey: string }[] = [
  { id: 'all', labelKey: 'dashboard.listings.statusFilter.all' },
  { id: 'live', labelKey: 'dashboard.listings.statusFilter.live' },
  { id: 'past', labelKey: 'dashboard.listings.statusFilter.past' },
  { id: 'completed', labelKey: 'dashboard.listings.statusFilter.completed' },
];

export function ListingStatusChips({
  active,
  onChange,
}: ListingStatusChipsProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {OPTIONS.map((option) => {
        const selected = active === option.id;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.id)}
            style={({ pressed }) => [
              styles.chip,
              selected ? styles.chipSelected : styles.chipIdle,
              pressed && styles.pressed,
            ]}
          >
            <AppText
              weight="semibold"
              style={[styles.label, selected ? styles.labelSelected : styles.labelIdle]}
            >
              {t(option.labelKey)}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipIdle: {
    backgroundColor: colors.white,
    borderColor: colors.border.default,
  },
  label: {
    fontSize: 12,
  },
  labelSelected: {
    color: colors.white,
  },
  labelIdle: {
    color: colors.text.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
