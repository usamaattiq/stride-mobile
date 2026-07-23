import React from 'react';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
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
  onRemovePress?: () => void;
  selected?: boolean;
};

export function VehicleListItem({
  vehicle,
  onPress,
  onRemovePress,
  selected = false,
}: VehicleListItemProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const classLabel = t(
    VEHICLE_CLASS_OPTIONS.find((item) => item.id === vehicle.vehicleClass)?.labelKey ??
      'vehicles.classPlaceholder',
  );
  const thumbnailUri = vehicle.photoDisplayUris?.[0] ?? vehicle.photoUris[0];

  return (
    <View style={[styles.item, selected && styles.itemSelected]}>
      <Pressable
        onPress={onPress}
        style={styles.itemBody}
        accessibilityRole="button"
        accessibilityLabel={vehicle.title}
      >
        <View style={styles.itemThumbnail}>
          {thumbnailUri ? (
            <Image source={{ uri: thumbnailUri }} style={styles.itemThumbnailImage} contentFit="cover" />
          ) : (
            <FontAwesome name="picture-o" size={18} color={colors.text.tertiary} />
          )}
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
      </Pressable>
      {onRemovePress ? (
        <Pressable
          onPress={onRemovePress}
          style={styles.removeButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('vehicles.remove.a11y', { title: vehicle.title })}
        >
          <FontAwesome name="times" size={14} color={colors.text.tertiary} />
        </Pressable>
      ) : selected ? (
        <FontAwesome name="check-circle" size={18} color={colors.primary} />
      ) : null}
    </View>
  );
}

export function VehiclesEmptyState({
  onAddPress,
  title,
  subtitle,
}: {
  onAddPress: () => void;
  title?: string;
  subtitle?: string;
}): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <View style={styles.empty}>
      <FontAwesome5 name="car-side" size={32} color={colors.text.tertiary} />
      <AppText weight="semibold" style={styles.emptyTitle}>
        {title ?? t('vehicles.emptyTitle')}
      </AppText>
      <AppText style={styles.emptySubtitle}>
        {subtitle ?? t('vehicles.emptySubtitle')}
      </AppText>
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
  itemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  itemBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  itemThumbnail: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.subtle,
  },
  itemThumbnailImage: {
    width: '100%',
    height: '100%',
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
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.subtle,
  },
  empty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
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
