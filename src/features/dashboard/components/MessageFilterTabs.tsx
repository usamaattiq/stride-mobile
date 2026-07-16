import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import type { MessageFilter } from '../types/messages.types';

type MessageFilterTabsProps = {
  active: MessageFilter;
  allCount: number;
  unreadCount: number;
  onChange: (filter: MessageFilter) => void;
};

export function MessageFilterTabs({
  active,
  allCount,
  unreadCount,
  onChange,
}: MessageFilterTabsProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <View style={styles.root}>
      <FilterChip
        label={t('dashboard.messages.filterAll')}
        count={allCount}
        selected={active === 'all'}
        onPress={() => onChange('all')}
      />
      <FilterChip
        label={t('dashboard.messages.filterUnread')}
        count={unreadCount}
        selected={active === 'unread'}
        onPress={() => onChange('unread')}
      />
    </View>
  );
}

type FilterChipProps = {
  label: string;
  count: number;
  selected: boolean;
  onPress: () => void;
};

function FilterChip({
  label,
  count,
  selected,
  onPress,
}: FilterChipProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipIdle,
        pressed && styles.pressed,
      ]}
    >
      <AppText
        weight="semibold"
        style={[styles.chipLabel, selected ? styles.chipLabelSelected : styles.chipLabelIdle]}
      >
        {label}
      </AppText>
      <View style={[styles.count, selected ? styles.countSelected : styles.countIdle]}>
        <AppText
          weight="bold"
          style={[styles.countText, selected ? styles.countTextSelected : styles.countTextIdle]}
        >
          {String(count)}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xxs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipIdle: {
    backgroundColor: colors.white,
    borderColor: colors.primary,
  },
  chipLabel: {
    fontSize: 12,
  },
  chipLabelSelected: {
    color: colors.white,
  },
  chipLabelIdle: {
    color: colors.primary,
  },
  count: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countSelected: {
    backgroundColor: colors.white,
  },
  countIdle: {
    backgroundColor: colors.primary,
  },
  countText: {
    fontSize: 10,
    lineHeight: 12,
  },
  countTextSelected: {
    color: colors.primary,
  },
  countTextIdle: {
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
});
