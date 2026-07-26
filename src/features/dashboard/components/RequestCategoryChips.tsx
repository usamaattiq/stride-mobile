import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import type { RequestCategory } from '../types/requests.types';

type RequestCategoryChipsProps = {
  active: RequestCategory;
  onChange: (category: RequestCategory) => void;
};

const CATEGORIES: {
  id: RequestCategory;
  labelKey: string;
  icon?: React.ComponentProps<typeof FontAwesome5>['name'];
}[] = [
  { id: 'all', labelKey: 'dashboard.home.categoryAll' },
  { id: 'rfq', labelKey: 'dashboard.home.categoryRfq' },
  { id: 'auction', labelKey: 'dashboard.home.categoryAuction' },
  { id: 'fullVehicle', labelKey: 'dashboard.home.categoryFullVehicle', icon: 'shuttle-van' },
  { id: 'shared', labelKey: 'dashboard.home.categoryShared' },
];

export function RequestCategoryChips({
  active,
  onChange,
}: RequestCategoryChipsProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {CATEGORIES.map((category) => {
        const selected = active === category.id;
        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(category.id)}
            style={({ pressed }) => [
              styles.chip,
              selected ? styles.chipSelected : styles.chipIdle,
              pressed && styles.pressed,
            ]}
          >
            {category.icon ? (
              <FontAwesome5
                name={category.icon}
                size={11}
                color={selected ? colors.white : colors.text.secondary}
                solid
              />
            ) : null}
            <AppText
              weight="semibold"
              style={[styles.label, selected ? styles.labelSelected : styles.labelIdle]}
            >
              {t(category.labelKey)}
            </AppText>
          </Pressable>
        );
      })}
      <View style={styles.more}>
        <FontAwesome5 name="chevron-down" size={10} color={colors.text.tertiary} />
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
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
  more: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
