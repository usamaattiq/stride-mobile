import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
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

const BUS_IMAGE = require('@/assets/images/bus.png');
const CAR_IMAGE = require('@/assets/images/sedan.png');

type VehicleModeOption = {
  id: TripVehicleMode;
  title: string;
  description: string;
  image: number;
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
      image: BUS_IMAGE,
    },
    {
      id: 'fullPrivate',
      title: t('trips.create.vehicleModeFullPrivate'),
      description: t('trips.create.vehicleModeFullPrivateHint'),
      image: CAR_IMAGE,
    },
  ];

  return (
    <AuthCard>
      <View style={styles.form}>
        <AppText weight="medium" style={styles.label}>
          {t('trips.create.vehicleModeLabel')}
          <AppText style={styles.required}> *</AppText>
        </AppText>

        <View style={styles.tiles}>
          {options.map((option) => {
            const selected = value === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => onChange(option.id)}
                style={[styles.tile, selected && styles.tileSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                {selected ? (
                  <View style={styles.checkBadge}>
                    <FontAwesome name="check" size={10} color={colors.white} />
                  </View>
                ) : null}

                <View style={styles.imageWrap}>
                  <Image
                    source={option.image}
                    style={styles.image}
                    contentFit="contain"
                  />
                </View>

                <AppText weight="bold" style={styles.tileTitle}>
                  {option.title}
                </AppText>
                <AppText style={styles.tileDescription}>{option.description}</AppText>
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
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    minHeight: 210,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    position: 'relative',
  },
  tileSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    width: '100%',
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tileTitle: {
    fontSize: 15,
    color: colors.text.primary,
    textAlign: 'center',
  },
  tileDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
