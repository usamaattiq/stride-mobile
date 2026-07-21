import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

type OptionButtonGroupOption<T extends string> = {
  id: T;
  label: string;
};

type OptionButtonGroupProps<T extends string> = {
  label: string;
  options: OptionButtonGroupOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  required?: boolean;
};

export function OptionButtonGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  required = false,
}: OptionButtonGroupProps<T>): React.ReactElement {
  return (
    <View style={styles.wrap}>
      <AppText weight="medium" style={styles.label}>
        {label}
        {required ? <AppText style={styles.required}> *</AppText> : null}
      </AppText>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange(option.id)}
              style={[styles.button, selected && styles.buttonSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <AppText weight={selected ? 'semibold' : 'regular'} style={styles.buttonLabel}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    color: colors.text.primary,
  },
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  buttonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  buttonLabel: {
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
