import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

import { VEHICLE_CLASS_OPTIONS } from '../constants/vehicleClasses';
import type { Vehicle } from '../types/vehicle.types';

type DriverVehicleBannerProps = {
  vehicleCount: number;
  onPress: () => void;
};

export function DriverVehicleBanner({
  vehicleCount,
  onPress,
}: DriverVehicleBannerProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <View style={styles.root}>
      <View style={styles.copy}>
        <AppText weight="bold" style={styles.title}>
          {t('vehicles.homeBannerTitle')}
        </AppText>
        <AppText style={styles.subtitle}>
          {vehicleCount > 0
            ? t('vehicles.homeBannerSubtitleWithCount', { count: vehicleCount })
            : t('vehicles.homeBannerSubtitleEmpty')}
        </AppText>
      </View>
      <Button
        label={t('vehicles.homeBannerCta')}
        onPress={onPress}
        style={styles.button}
      />
    </View>
  );
}

type VehicleListItemProps = {
  vehicle: Vehicle;
  onPress: () => void;
};

export function VehicleListItem({
  vehicle,
  onPress,
}: VehicleListItemProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const classLabel = t(
    VEHICLE_CLASS_OPTIONS.find((item) => item.id === vehicle.vehicleClass)?.labelKey ??
      'vehicles.classPlaceholder',
  );

  return (
    <Pressable
      onPress={onPress}
      style={styles.item}
      accessibilityRole="button"
      accessibilityLabel={vehicle.title}
    >
      <View style={styles.itemIcon}>
        <FontAwesome5 name="car" size={18} color={colors.primary} />
      </View>
      <View style={styles.itemCopy}>
        <AppText weight="semibold" style={styles.itemTitle} numberOfLines={1}>
          {vehicle.title}
        </AppText>
        <AppText style={styles.itemMeta} numberOfLines={1}>
          {[vehicle.plateNumber, classLabel, t('vehicles.seatsCount', { count: vehicle.totalSeats })]
            .filter(Boolean)
            .join(' · ')}
        </AppText>
        <AppText style={styles.itemAc}>
          {vehicle.hasAc ? t('vehicles.fields.acOn') : t('vehicles.fields.acOff')}
        </AppText>
      </View>
      <FontAwesome5 name="chevron-right" size={12} color={colors.text.tertiary} />
    </Pressable>
  );
}

export function VehiclesEmptyState({
  onAddPress,
}: {
  onAddPress: () => void;
}): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <View style={styles.empty}>
      <FontAwesome5 name="car-side" size={32} color={colors.text.tertiary} />
      <AppText weight="semibold" style={styles.emptyTitle}>
        {t('vehicles.emptyTitle')}
      </AppText>
      <AppText style={styles.emptySubtitle}>{t('vehicles.emptySubtitle')}</AppText>
      <Button label={t('vehicles.addVehicle')} onPress={onAddPress} style={styles.emptyButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.sm,
  },
  copy: {
    gap: spacing.xxs,
  },
  title: {
    fontSize: 16,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  button: {
    minHeight: 48,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  itemTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  itemAc: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  empty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  emptyButton: {
    minWidth: 180,
  },
});
