import React from 'react';
import { FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import {
  VEHICLE_CLASS_OPTIONS,
  getVehicleClassImage,
  getVehicleClassLabelKey,
} from '../constants/vehicleClasses';
import type { VehicleClass } from '../types/vehicle.types';

type VehicleClassPickerProps = {
  value: VehicleClass | null;
  onChange: (value: VehicleClass) => void;
  label: string;
  placeholder: string;
  required?: boolean;
  error?: string;
  onBlur?: () => void;
};

export function VehicleClassPicker({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  error,
  onBlur,
}: VehicleClassPickerProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [pickerVisible, setPickerVisible] = React.useState(false);

  const selectedLabel = value ? t(getVehicleClassLabelKey(value)) : placeholder;
  const selectedImage = getVehicleClassImage(value);

  const closePicker = () => {
    setPickerVisible(false);
    onBlur?.();
  };

  return (
    <View style={styles.wrap}>
      <AppText weight="medium" style={styles.label}>
        {label}
        {required ? <AppText style={styles.required}> *</AppText> : null}
      </AppText>

      <Pressable
        onPress={() => setPickerVisible(true)}
        style={[styles.field, error ? styles.fieldError : null]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.fieldLeading}>
          <View style={styles.iconWrap}>
            {selectedImage ? (
              <Image source={selectedImage} style={styles.fieldImage} contentFit="contain" />
            ) : (
              <FontAwesome5 name="car" size={14} color={colors.primary} solid />
            )}
          </View>
          <AppText style={[styles.value, !value && styles.placeholder]}>{selectedLabel}</AppText>
        </View>
        <FontAwesome5 name="chevron-down" size={10} color={colors.text.secondary} solid />
      </Pressable>
      {error ? <AppText style={styles.error}>{error}</AppText> : null}

      <AppBottomSheet visible={pickerVisible} onClose={closePicker} heightRatio={0.6}>
        <View style={styles.sheetHandle} />
        <AppText weight="semibold" style={styles.sheetTitle}>
          {t('vehicles.classPickerTitle')}
        </AppText>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {VEHICLE_CLASS_OPTIONS.map((option) => {
            const selected = value === option.id;
            const imageSource = getVehicleClassImage(option.id);
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
                <View style={styles.optionLeading}>
                  <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                    {imageSource ? (
                      <Image
                        source={imageSource}
                        style={styles.optionImage}
                        contentFit="contain"
                      />
                    ) : null}
                  </View>
                  <AppText weight={selected ? 'semibold' : 'regular'} style={styles.optionLabel}>
                    {t(option.labelKey)}
                  </AppText>
                </View>
                {selected ? (
                  <FontAwesome5 name="check" size={14} color={colors.primary} solid />
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
    paddingHorizontal: spacing.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  fieldError: {
    borderColor: colors.primary,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
  },
  fieldLeading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
    padding: 2,
  },
  fieldImage: {
    width: '100%',
    height: '100%',
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
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
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
  optionLeading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    overflow: 'hidden',
    padding: 2,
  },
  optionIconSelected: {
    backgroundColor: colors.white,
  },
  optionImage: {
    width: '100%',
    height: '100%',
  },
  optionLabel: {
    fontSize: 15,
    color: colors.text.primary,
  },
});
