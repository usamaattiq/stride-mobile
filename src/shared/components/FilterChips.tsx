import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

export type FilterChipOption<T extends string> = {
  id: T;
  label: string;
  showDot?: boolean;
};

type FilterChipsProps<T extends string> = {
  options: FilterChipOption<T>[];
  active: T;
  onChange: (value: T) => void;
};

export function FilterChips<T extends string>({
  options,
  active,
  onChange,
}: FilterChipsProps<T>): React.ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
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
              {option.label}
            </AppText>
            {option.showDot ? (
              <View style={[styles.dot, selected && styles.dotOnSelected]} />
            ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  dotOnSelected: {
    backgroundColor: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
});
