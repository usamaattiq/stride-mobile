import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

type FeedPaginationBarProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function FeedPaginationBar({
  page,
  totalPages,
  onPageChange,
}: FeedPaginationBarProps): React.ReactElement | null {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  if (totalPages <= 1) {
    return null;
  }

  const canGoBack = page > 1;
  const canGoForward = page < totalPages;

  return (
    <View style={styles.root}>
      <AppText style={styles.label}>
        {t('dashboard.home.pageOf', { page, total: totalPages })}
      </AppText>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.home.previousPageA11y')}
          disabled={!canGoBack}
          onPress={() => onPageChange(page - 1)}
          style={({ pressed }) => [
            styles.arrowButton,
            !canGoBack && styles.arrowDisabled,
            pressed && canGoBack && styles.pressed,
          ]}
        >
          <FontAwesome
            name="chevron-left"
            size={11}
            color={canGoBack ? colors.text.primary : colors.text.tertiary}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.home.nextPageA11y')}
          disabled={!canGoForward}
          onPress={() => onPageChange(page + 1)}
          style={({ pressed }) => [
            styles.arrowButton,
            !canGoForward && styles.arrowDisabled,
            pressed && canGoForward && styles.pressed,
          ]}
        >
          <FontAwesome
            name="chevron-right"
            size={11}
            color={canGoForward ? colors.text.primary : colors.text.tertiary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    minHeight: 28,
  },
  label: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
  },
});
