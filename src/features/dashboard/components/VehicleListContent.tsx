import React from 'react';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
    <View style={styles.banner}>
      <View style={styles.bannerCopy}>
        <AppText weight="bold" style={styles.bannerTitle}>
          {t('vehicles.homeBannerTitle')}
        </AppText>
        <AppText style={styles.bannerSubtitle}>
          {vehicleCount > 0
            ? t('vehicles.homeBannerSubtitleWithCount', { count: vehicleCount })
            : t('vehicles.homeBannerSubtitleEmpty')}
        </AppText>
      </View>
      <Button
        label={t('vehicles.homeBannerCta')}
        onPress={onPress}
        style={styles.bannerButton}
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
  const photoTotal = vehicle.photoUris.length;
  const brandModel = [vehicle.brand, vehicle.model].filter(Boolean).join(' ');
  const yearLabel = vehicle.year.trim() || null;
  const subtitle = [brandModel, yearLabel].filter(Boolean).join(' · ');
  const acLabel = vehicle.hasAc ? t('vehicles.fields.acOn') : t('vehicles.fields.acOff');

  return (
    <Pressable
      onPress={onPress}
      style={[styles.item, selected && styles.itemSelected]}
      accessibilityRole="button"
      accessibilityLabel={vehicle.title}
      accessibilityState={{ selected }}
    >
      <LinearGradient
        colors={
          selected
            ? ['#FFF7F6', '#FEE4E2', '#FECACA']
            : ['#FFFFFF', '#FFF7F6', '#FEE4E2']
        }
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(254, 228, 226, 0)', 'rgba(254, 228, 226, 0.55)', 'rgba(253, 210, 207, 0.7)']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.35, y: 0.15 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientWash}
        pointerEvents="none"
      />

      <View style={styles.mainRow}>
        <View style={styles.thumbnail}>
          {thumbnailUri ? (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.thumbnailImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.thumbnailFallback}>
              <FontAwesome name="car" size={22} color={colors.text.tertiary} />
            </View>
          )}
          {photoTotal > 1 ? (
            <View style={styles.photoBadge}>
              <FontAwesome name="image" size={9} color={colors.white} />
              <AppText weight="semibold" style={styles.photoBadgeText}>
                {t('dashboard.listings.card.photoCount', {
                  current: 1,
                  total: photoTotal,
                })}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.itemBody}>
          <View style={styles.itemTopRow}>
            <View style={styles.titleBlock}>
              <AppText weight="bold" style={styles.itemTitle} numberOfLines={1}>
                {vehicle.title}
              </AppText>
              {subtitle ? (
                <AppText style={styles.itemSubtitle} numberOfLines={1}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
            {onRemovePress ? (
              <Pressable
                onPress={onRemovePress}
                style={styles.removeButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('vehicles.remove.a11y', { title: vehicle.title })}
              >
                <FontAwesome name="trash-o" size={14} color={colors.primary} />
              </Pressable>
            ) : selected ? (
              <View style={styles.selectedBadge}>
                <FontAwesome name="check" size={9} color={colors.white} />
              </View>
            ) : null}
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <FontAwesome name="car" size={11} color={colors.primary} />
              <AppText style={styles.metaText} numberOfLines={1}>
                {classLabel}
              </AppText>
            </View>
            <View style={styles.detailItem}>
              <FontAwesome name="users" size={11} color={colors.primary} />
              <AppText style={styles.metaText} numberOfLines={1}>
                {t('vehicles.seatsCount', { count: vehicle.totalSeats })}
              </AppText>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <FontAwesome name="id-card-o" size={11} color={colors.primary} />
              <AppText style={styles.metaText} numberOfLines={1}>
                {vehicle.plateNumber}
              </AppText>
            </View>
            <View style={styles.detailItem}>
              <FontAwesome name="snowflake-o" size={11} color={colors.primary} />
              <AppText style={styles.metaText} numberOfLines={1}>
                {acLabel}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function VehiclesEmptyState({
  title,
  subtitle,
}: {
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
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.sm,
  },
  bannerCopy: {
    gap: spacing.xxs,
  },
  bannerTitle: {
    fontSize: 16,
    color: colors.text.primary,
  },
  bannerSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  bannerButton: {
    minHeight: 48,
  },
  item: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    overflow: 'hidden',
    shadowColor: '#B42318',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  itemSelected: {
    borderColor: colors.primary,
  },
  gradientWash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '58%',
  },
  mainRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  thumbnail: {
    width: 84,
    height: 78,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  photoBadgeText: {
    fontSize: 9,
    color: colors.white,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  itemTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  itemSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  selectedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  metaText: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.text.secondary,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
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
  },
});
