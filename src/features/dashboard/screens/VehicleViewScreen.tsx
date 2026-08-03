import React from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { ImageGalleryModal } from '@/shared/components/ImageGalleryModal';
import { colors, radius, spacing } from '@/theme';

import { VEHICLE_CLASS_OPTIONS } from '../constants/vehicleClasses';
import { useVehicles } from '../context/VehicleContext';
import { resolveVehicleStackOrigin } from '../navigation/vehicleNavigation.utils';
import type { VehicleRouteParamList } from '../navigation/vehicleNavigation.types';

const HERO_HEIGHT = 180;

export function VehicleViewScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<VehicleRouteParamList, 'VehicleView'>>();
  const route = useRoute<RouteProp<VehicleRouteParamList, 'VehicleView'>>();
  const { getVehicleById, beginEditVehicle, removeVehicle, isSaving } = useVehicles();
  const stackOrigin = resolveVehicleStackOrigin(navigation);

  const vehicle = getVehicleById(route.params.vehicleId);
  const [photoIndex, setPhotoIndex] = React.useState(0);
  const [galleryOpen, setGalleryOpen] = React.useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [removeError, setRemoveError] = React.useState<string | null>(null);

  const photos = React.useMemo(() => {
    if (!vehicle) {
      return [];
    }
    return vehicle.photoDisplayUris?.length
      ? vehicle.photoDisplayUris
      : vehicle.photoUris;
  }, [vehicle]);

  React.useEffect(() => {
    setDescriptionExpanded(false);
  }, [vehicle?.id, vehicle?.description]);

  const openEdit = React.useCallback(() => {
    if (!vehicle) {
      return;
    }
    if (beginEditVehicle(vehicle.id)) {
      navigation.navigate('VehicleDetails', {
        mode: 'edit',
        vehicleId: vehicle.id,
        returnTo: 'VehicleView',
        stackOrigin,
      });
    }
  }, [beginEditVehicle, navigation, stackOrigin, vehicle]);

  const openRemove = React.useCallback(() => {
    setRemoveError(null);
    setConfirmRemove(true);
  }, []);

  const handleConfirmRemove = React.useCallback(() => {
    if (!vehicle || isSaving) {
      return;
    }

    setRemoveError(null);
    void removeVehicle(vehicle.id)
      .then(() => {
        setConfirmRemove(false);
        navigation.goBack();
      })
      .catch((error) => {
        setRemoveError(getErrorMessage(error, t('vehicles.remove.failed')));
      });
  }, [isSaving, navigation, removeVehicle, t, vehicle]);

  if (!vehicle) {
    return (
      <AuthScaffold
        onBack={() => navigation.goBack()}
        title={t('vehicles.view.title')}
        showLegalFooter={false}
        showLanguageSwitcher={false}
        compactHeader
      >
        <View style={styles.missing}>
          <FontAwesome5 name="car" size={36} color={colors.text.tertiary} />
          <AppText weight="semibold" style={styles.missingTitle}>
            {t('vehicles.view.notFound')}
          </AppText>
          <Button label={t('common.ok')} onPress={() => navigation.goBack()} />
        </View>
      </AuthScaffold>
    );
  }

  const classLabel = t(
    VEHICLE_CLASS_OPTIONS.find((item) => item.id === vehicle.vehicleClass)?.labelKey ??
      'vehicles.classPlaceholder',
  );
  const brand = vehicle.brand.trim();
  const model = vehicle.model.trim();
  const year = vehicle.year.trim();
  const description = vehicle.description.trim();

  const overviewRows: OverviewRowData[] = [
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
    {
      icon: 'snowflake-o',
      label: t('vehicles.fields.acTitle'),
      value: vehicle.hasAc ? t('vehicles.fields.acOn') : t('vehicles.fields.acOff'),
    },
    brand
      ? {
          icon: 'building' as const,
          label: t('vehicles.fields.brand'),
          value: brand,
        }
      : null,
    model
      ? {
          icon: 'tag' as const,
          label: t('vehicles.fields.model'),
          value: model,
        }
      : null,
    year
      ? {
          icon: 'calendar' as const,
          label: t('vehicles.fields.year'),
          value: year,
        }
      : null,
  ].filter((row): row is OverviewRowData => row != null);

  return (
    <AuthScaffold
      onBack={() => navigation.goBack()}
      title={t('vehicles.view.title')}
      showLegalFooter={false}
      showLanguageSwitcher={false}
      compactHeader
      scrollable={false}
      contentWrapStyle={styles.contentWrap}
      headerRight={
        <Pressable
          onPress={openRemove}
          style={styles.headerRemoveButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('vehicles.remove.a11y', { title: vehicle.title })}
        >
          <FontAwesome name="trash-o" size={16} color={colors.white} />
        </Pressable>
      }
    >
      <View style={styles.root}>
        <View style={styles.body}>
          <PhotoHero
            photos={photos}
            index={photoIndex}
            onIndexChange={setPhotoIndex}
            onOpenGallery={() => setGalleryOpen(true)}
          />

          <AppText weight="bold" style={styles.heroTitle} numberOfLines={1}>
            {vehicle.title}
          </AppText>

          {description ? (
            <View style={styles.card}>
              <SectionHeader
                icon="align-left"
                title={t('dashboard.listings.detail.description')}
                right={
                  <Pressable
                    onPress={() => setDescriptionExpanded((current) => !current)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      descriptionExpanded
                        ? t('dashboard.listings.detail.showLess')
                        : t('dashboard.listings.detail.showMore')
                    }
                  >
                    <FontAwesome
                      name={descriptionExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.text.tertiary}
                    />
                  </Pressable>
                }
              />
              {descriptionExpanded ? (
                <AppText style={styles.descriptionText}>{description}</AppText>
              ) : null}
            </View>
          ) : null}

          <View style={styles.card}>
            <SectionHeader
              icon="list-alt"
              title={t('vehicles.view.sections.overview')}
            />
            <View style={styles.overviewList}>
              {overviewRows.map((row, index) => (
                <OverviewRow
                  key={row.label}
                  icon={row.icon}
                  label={row.label}
                  value={row.value}
                  last={index === overviewRows.length - 1}
                />
              ))}
            </View>
          </View>
        </View>

        <Button
          label={t('vehicles.view.edit')}
          onPress={openEdit}
          style={styles.editFooter}
        />
      </View>

      <ImageGalleryModal
        visible={galleryOpen}
        images={photos}
        initialIndex={photoIndex}
        onClose={() => setGalleryOpen(false)}
      />

      <AppDialog
        visible={confirmRemove}
        icon="trash"
        title={t('vehicles.remove.title')}
        message={
          removeError ?? t('vehicles.remove.confirm', { title: vehicle.title })
        }
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => {
            if (isSaving) {
              return;
            }
            setConfirmRemove(false);
            setRemoveError(null);
          },
        }}
        confirmAction={{
          label: t('vehicles.remove.confirmAction'),
          onPress: handleConfirmRemove,
        }}
      />
    </AuthScaffold>
  );
}

type SectionHeaderProps = {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  right?: React.ReactNode;
};

function SectionHeader({ icon, title, right }: SectionHeaderProps): React.ReactElement {
  return (
    <View style={styles.cardHeader}>
      <View style={styles.sectionIcon}>
        <FontAwesome name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.cardHeaderCopy}>
        <AppText weight="bold" style={styles.sectionTitle}>
          {title}
        </AppText>
      </View>
      {right ?? null}
    </View>
  );
}

type OverviewRowData = {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  value: string;
};

type OverviewRowProps = OverviewRowData & {
  last?: boolean;
};

function OverviewRow({
  icon,
  label,
  value,
  last = false,
}: OverviewRowProps): React.ReactElement {
  return (
    <View style={[styles.overviewRow, last ? null : styles.overviewRowDivider]}>
      <View style={styles.overviewLeading}>
        <FontAwesome name={icon} size={12} color={colors.primary} />
        <AppText style={styles.rowLabel}>{label}</AppText>
      </View>
      <AppText weight="semibold" style={styles.rowValue} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

type PhotoHeroProps = {
  photos: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onOpenGallery: () => void;
};

function PhotoHero({
  photos,
  index,
  onIndexChange,
  onOpenGallery,
}: PhotoHeroProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const width = Dimensions.get('window').width - spacing.md * 2;

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1));
    if (next !== index) {
      onIndexChange(next);
    }
  };

  if (photos.length === 0) {
    return (
      <View style={[styles.hero, styles.heroEmpty, { width }]}>
        <LinearGradient
          colors={['#FFF7F6', '#FEE4E2']}
          style={StyleSheet.absoluteFillObject}
        />
        <FontAwesome name="car" size={36} color={colors.text.tertiary} />
        <AppText style={styles.heroEmptyText}>{t('vehicles.view.noPhotos')}</AppText>
      </View>
    );
  }

  return (
    <View style={[styles.heroWrap, { width }]}>
      <FlatList
        data={photos}
        keyExtractor={(uri, i) => `${uri}-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item, index: itemIndex }: ListRenderItemInfo<string>) => (
          <Pressable
            onPress={onOpenGallery}
            style={{ width, height: HERO_HEIGHT }}
            accessibilityRole="imagebutton"
            accessibilityLabel={t('vehicles.view.photoA11y', {
              number: itemIndex + 1,
              total: photos.length,
            })}
          >
            <Image source={{ uri: item }} style={styles.heroImage} contentFit="cover" />
          </Pressable>
        )}
      />
      <LinearGradient
        colors={['transparent', 'rgba(10,10,10,0.4)']}
        style={styles.heroFade}
        pointerEvents="none"
      />
      {photos.length > 1 ? (
        <View style={styles.heroBadge}>
          <FontAwesome name="image" size={10} color={colors.white} />
          <AppText weight="semibold" style={styles.heroBadgeText}>
            {t('dashboard.listings.card.photoCount', {
              current: index + 1,
              total: photos.length,
            })}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  headerRemoveButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  root: {
    flex: 1,
    gap: spacing.md,
  },
  body: {
    gap: spacing.xs,
  },
  editFooter: {
    marginTop: 'auto',
  },
  heroWrap: {
    height: HERO_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignSelf: 'center',
    backgroundColor: colors.background.subtle,
    marginBottom: spacing.xs,
  },
  hero: {
    height: HERO_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  heroEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  heroEmptyText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
  },
  heroBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: 'rgba(10,10,10,0.65)',
  },
  heroBadgeText: {
    fontSize: 11,
    color: colors.white,
  },
  heroTitle: {
    fontSize: 20,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  overviewList: {
    paddingHorizontal: spacing.sm,
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
    gap: 6,
    flexShrink: 0,
  },
  rowLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  rowValue: {
    flex: 1,
    fontSize: 13,
    color: colors.text.primary,
    textAlign: 'right',
  },
  missing: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  missingTitle: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
