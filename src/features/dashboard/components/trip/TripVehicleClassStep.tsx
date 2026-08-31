import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import {
  VEHICLE_CLASS_OPTIONS,
  getVehicleClassImage,
} from '@/features/dashboard/constants/vehicleClasses';
import type { VehicleClass } from '@/features/dashboard/types/vehicle.types';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

type TripVehicleClassStepProps = {
  value: VehicleClass | null;
  onChange: (value: VehicleClass) => void;
  onContinue: () => void;
};

export function TripVehicleClassStep({
  value,
  onChange,
  onContinue,
}: TripVehicleClassStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <AuthCard>
      <View style={styles.form}>
        <AppText weight="medium" style={styles.label}>
          {t('trips.create.vehicleClassLabel')}
          <AppText style={styles.required}> *</AppText>
        </AppText>

        <View style={styles.options}>
          {VEHICLE_CLASS_OPTIONS.map((option) => {
            const selected = value === option.id;
            const imageSource = getVehicleClassImage(option.id);
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
                    <FontAwesome name="check" size={8} color={colors.white} />
                  </View>
                ) : null}

                <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                  {imageSource ? (
                    <Image
                      source={imageSource}
                      style={styles.optionImage}
                      contentFit="contain"
                    />
                  ) : (
                    <FontAwesome name="car" size={16} color={colors.primary} />
                  )}
                </View>

                <View style={styles.optionCopy}>
                  <AppText weight="bold" style={styles.optionTitle}>
                    {t(option.labelKey)}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Button label={t('common.continue')} onPress={onContinue} disabled={!value} eagerPress />
      </View>
    </AuthCard>
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
    gap: spacing.xs,
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
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.background.subtle,
    alignItems: 'center',
    justifyContent: 'center',
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
  optionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingRight: spacing.md,
  },
  optionTitle: {
    fontSize: 14,
    color: colors.text.primary,
  },
});
