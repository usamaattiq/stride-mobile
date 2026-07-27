import React from 'react';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { TripVehicleMode } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

type TripVehicleModeStepProps = {
  value: TripVehicleMode | null;
  onChange: (value: TripVehicleMode) => void;
  onContinue: () => void;
};

type VehicleModeOption = {
  id: TripVehicleMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  selectedIcon: React.ReactNode;
};

export function TripVehicleModeStep({
  value,
  onChange,
  onContinue,
}: TripVehicleModeStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  const options: VehicleModeOption[] = [
    {
      id: 'shared',
      title: t('trips.create.vehicleModeShared'),
      description: t('trips.create.vehicleModeSharedHint'),
      icon: <FontAwesome name="users" size={16} color={colors.text.tertiary} />,
      selectedIcon: <FontAwesome name="users" size={16} color={colors.primary} />,
    },
    {
      id: 'fullPrivate',
      title: t('trips.create.vehicleModeFullPrivate'),
      description: t('trips.create.vehicleModeFullPrivateHint'),
      icon: <FontAwesome5 name="car-side" size={15} color={colors.text.tertiary} />,
      selectedIcon: <FontAwesome5 name="car-side" size={15} color={colors.primary} />,
    },
  ];

  return (
    <View style={styles.form}>
        <AppText weight="medium" style={styles.label}>
          {t('trips.create.vehicleModeLabel')}
          <AppText style={styles.required}> *</AppText>
        </AppText>

        <View style={styles.options}>
          {options.map((option) => {
            const selected = value === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => onChange(option.id)}
                style={[styles.optionCard, selected && styles.optionCardSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                {selected ? (
                  <View style={styles.checkBadge}>
                    <FontAwesome name="check" size={9} color={colors.white} />
                  </View>
                ) : null}

                <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                  {selected ? option.selectedIcon : option.icon}
                </View>

                <View style={styles.optionCopy}>
                  <AppText weight="bold" style={styles.optionTitle}>
                    {option.title}
                  </AppText>
                  <AppText style={styles.optionDescription}>{option.description}</AppText>
                </View>
              </Pressable>
            );
          })}
        </View>

      <Button label={t('common.continue')} onPress={onContinue} disabled={!value} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  label: {
    fontSize: 13,
    color: colors.text.primary,
  },
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  options: {
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: colors.white,
  },
  optionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingRight: spacing.md,
  },
  optionTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
});
