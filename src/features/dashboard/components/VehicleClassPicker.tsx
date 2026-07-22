import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import { VEHICLE_CLASS_OPTIONS } from '../constants/vehicleClasses';
import type { VehicleClass } from '../types/vehicle.types';

type VehicleClassPickerProps = {
  value: VehicleClass | null;
  onChange: (value: VehicleClass) => void;
  label: string;
  placeholder: string;
  required?: boolean;
};

export function VehicleClassPicker({
  value,
  onChange,
  label,
  placeholder,
  required = false,
}: VehicleClassPickerProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [pickerVisible, setPickerVisible] = React.useState(false);

  const selectedLabel = value
    ? t(VEHICLE_CLASS_OPTIONS.find((item) => item.id === value)?.labelKey ?? 'vehicles.classPlaceholder')
    : placeholder;

  const closePicker = () => setPickerVisible(false);

  return (
    <View style={styles.wrap}>
      <AppText weight="medium" style={styles.label}>
        {label}
        {required ? <AppText style={styles.required}> *</AppText> : null}
      </AppText>

      <Pressable
        onPress={() => setPickerVisible(true)}
        style={styles.field}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <AppText style={[styles.value, !value && styles.placeholder]}>{selectedLabel}</AppText>
        <FontAwesome name="chevron-down" size={10} color={colors.text.secondary} />
      </Pressable>

      <AppBottomSheet visible={pickerVisible} onClose={closePicker} heightRatio={0.55}>
        <View style={styles.sheetHandle} />
        <AppText weight="semibold" style={styles.sheetTitle}>
          {t('vehicles.classPickerTitle')}
        </AppText>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {VEHICLE_CLASS_OPTIONS.map((option) => {
            const selected = value === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => {
                  onChange(option.id);
                  closePicker();
                }}
                style={[styles.option, selected && styles.optionSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <AppText weight={selected ? 'semibold' : 'regular'} style={styles.optionLabel}>
                  {t(option.labelKey)}
                </AppText>
                {selected ? (
                  <FontAwesome name="check" size={14} color={colors.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </AppBottomSheet>
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
  field: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  value: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  placeholder: {
    color: colors.text.tertiary,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border.strong,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  option: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionLabel: {
    fontSize: 15,
    color: colors.text.primary,
  },
});
