import React from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { VEHICLE_CLASS_OPTIONS } from '@/features/dashboard/constants/vehicleClasses';
import type { Vehicle } from '@/features/dashboard/types/vehicle.types';
import { i18n as appI18n } from '@/i18n';
import type { RfqOfferVehicleSummary } from '@/services/api/rfqApi.types';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppText } from '@/shared/components/AppText';
import { ImageGalleryModal } from '@/shared/components/ImageGalleryModal';
import { colors, radius, spacing } from '@/theme';

export type OfferVehicleDetailSource = RfqOfferVehicleSummary | Vehicle;

function photosFromVehicle(vehicle: OfferVehicleDetailSource): string[] {
  if ('photoDisplayUris' in vehicle && vehicle.photoDisplayUris?.length) {
    return vehicle.photoDisplayUris;
  }
  if ('photoUris' in vehicle && vehicle.photoUris.length) {
    return vehicle.photoDisplayUris?.length ? vehicle.photoDisplayUris : vehicle.photoUris;
  }
  if ('photoUrls' in vehicle && vehicle.photoUrls?.length) {
    return vehicle.photoDisplayUris?.length ? vehicle.photoDisplayUris : vehicle.photoUrls;
  }
  const single =
    'photoViewUrl' in vehicle
      ? (vehicle.photoViewUrl ?? vehicle.photoUrl)
      : vehicle.photoDisplayUris?.[0] ?? vehicle.photoUris[0] ?? null;
  return single ? [single] : [];
}

type OfferVehicleDetailSheetProps = {
  visible: boolean;
  vehicle: OfferVehicleDetailSource | null;
  onClose: () => void;
};

const HERO_HEIGHT = 160;

export function OfferVehicleDetailSheet({
  visible,
  vehicle,
  onClose,
}: OfferVehicleDetailSheetProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [photoIndex, setPhotoIndex] = React.useState(0);
  const [galleryOpen, setGalleryOpen] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setPhotoIndex(0);
      setGalleryOpen(false);
    }
  }, [visible, vehicle?.id]);

  const photos = vehicle ? photosFromVehicle(vehicle) : [];
  const width = Dimensions.get('window').width - spacing.lg * 2;

  const classLabel = vehicle
    ? t(
        VEHICLE_CLASS_OPTIONS.find((item) => item.id === vehicle.vehicleClass)?.labelKey ??
          'vehicles.classPlaceholder',
      )
    : '';

  const brand = vehicle?.brand?.trim() ?? '';
  const model = vehicle?.model?.trim() ?? '';
  const year =
    vehicle == null
      ? ''
      : 'photoUrl' in vehicle && vehicle.year != null
        ? String(vehicle.year)
        : !('photoUrl' in vehicle)
          ? vehicle.year.trim()
          : '';
  const description =
    vehicle && 'description' in vehicle ? vehicle.description.trim() : '';

  const overviewRows: Array<{
    icon: React.ComponentProps<typeof FontAwesome>['name'];
    label: string;
    value: string;
  }> = vehicle
    ? [
        {
          icon: 'id-card-o',
          label: t('vehicles.fields.plateNumber'),
          value: vehicle.plateNumber,
        },
        {
          icon: 'car',
          label: t('vehicles.fields.class'),
          value: classLabel,
        },
        {
          icon: 'users',
          label: t('vehicles.fields.totalSeats'),
          value: t('vehicles.seatsCount', { count: vehicle.totalSeats }),
        },
        vehicle.hasAc !== undefined
          ? {
              icon: 'snowflake-o',
              label: t('vehicles.fields.acTitle'),
              value: vehicle.hasAc ? t('vehicles.fields.acOn') : t('vehicles.fields.acOff'),
            }
          : null,
        brand
          ? {
              icon: 'building',
              label: t('vehicles.fields.brand'),
              value: brand,
            }
          : null,
        model
          ? {
              icon: 'tag',
              label: t('vehicles.fields.model'),
              value: model,
            }
          : null,
        year
          ? {
              icon: 'calendar',
              label: t('vehicles.fields.year'),
              value: year,
            }
          : null,
      ].filter((row): row is { icon: React.ComponentProps<typeof FontAwesome>['name']; label: string; value: string } => row != null)
    : [];

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1));
    if (next !== photoIndex) {
      setPhotoIndex(next);
    }
  };

  const renderPhoto = ({ item }: ListRenderItemInfo<string>) => (
    <Pressable onPress={() => setGalleryOpen(true)} accessibilityRole="button">
      <Image
        source={{ uri: item }}
        style={{ width, height: HERO_HEIGHT }}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={item.split('?')[0]}
        transition={0}
      />
    </Pressable>
  );

  return (
    <>
      <AppBottomSheet visible={visible} onClose={onClose} heightRatio={0.93}>
        <View style={styles.header}>
          <AppText weight="bold" style={styles.headerTitle} numberOfLines={1}>
            {vehicle?.title ?? t('vehicles.view.title')}
          </AppText>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('legal.common.close')}
          >
            <FontAwesome name="times" size={18} color={colors.text.tertiary} />
          </Pressable>
        </View>

        {vehicle ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {photos.length === 0 ? (
              <View style={[styles.heroEmpty, { width }]}>
                <LinearGradient
                  colors={['#FFF7F6', '#FEE4E2']}
                  style={StyleSheet.absoluteFillObject}
                />
                <FontAwesome name="car" size={32} color={colors.text.tertiary} />
                <AppText style={styles.heroEmptyText}>{t('vehicles.view.noPhotos')}</AppText>
              </View>
            ) : (
              <View style={styles.heroWrap}>
                <FlatList
                  data={photos}
                  keyExtractor={(uri, index) => `${uri.split('?')[0]}-${index}`}
                  renderItem={renderPhoto}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={onScrollEnd}
                  getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                  })}
                />
                {photos.length > 1 ? (
                  <View style={styles.photoBadge}>
                    <AppText weight="semibold" style={styles.photoBadgeText}>
                      {photoIndex + 1}/{photos.length}
                    </AppText>
                  </View>
                ) : null}
              </View>
            )}

            {description ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <FontAwesome name="align-left" size={14} color={colors.primary} />
                  <AppText weight="bold" style={styles.sectionTitle}>
                    {t('dashboard.listings.detail.description')}
                  </AppText>
                </View>
                <AppText style={styles.descriptionText}>{description}</AppText>
              </View>
            ) : null}

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <FontAwesome name="list-alt" size={14} color={colors.primary} />
                <AppText weight="bold" style={styles.sectionTitle}>
                  {t('vehicles.view.sections.overview')}
                </AppText>
              </View>
              <View style={styles.overviewList}>
                {overviewRows.map((row, index) => (
                  <View
                    key={row.label}
                    style={[
                      styles.overviewRow,
                      index < overviewRows.length - 1 ? styles.overviewRowDivider : null,
                    ]}
                  >
                    <View style={styles.overviewLeading}>
                      <FontAwesome name={row.icon} size={12} color={colors.primary} />
                      <AppText style={styles.rowLabel}>{row.label}</AppText>
                    </View>
                    <AppText weight="semibold" style={styles.rowValue} numberOfLines={2}>
                      {row.value}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        ) : null}
      </AppBottomSheet>

      <ImageGalleryModal
        visible={galleryOpen}
        images={photos}
        initialIndex={photoIndex}
        onClose={() => setGalleryOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    color: colors.text.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  heroWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  heroEmpty: {
    height: HERO_HEIGHT,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    overflow: 'hidden',
  },
  heroEmptyText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  photoBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  photoBadgeText: {
    fontSize: 11,
    color: colors.white,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    color: colors.text.primary,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  overviewList: {
    gap: 0,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  overviewRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  overviewLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  rowLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  rowValue: {
    flex: 1,
    fontSize: 13,
    color: colors.text.primary,
    textAlign: 'right',
  },
});
