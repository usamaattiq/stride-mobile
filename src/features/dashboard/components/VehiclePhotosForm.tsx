import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { prepareLocalImage } from '@/shared/services/mediaUploadService';
import { colors, radius, spacing } from '@/theme';

import { MAX_VEHICLE_PHOTOS } from '../types/vehicle.types';

type VehiclePhotosFormProps = {
  photoUris: string[];
  onAddPhotos: (uris: string[]) => void;
  onRemovePhoto: (index: number) => void;
  onSetCoverPhoto: (index: number) => void;
  onSubmit: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
  loading?: boolean;
};

const GRID_GAP = spacing.sm;
const COLUMNS = 3;
const SCREEN_CONTENT_WIDTH = Math.max(0, Dimensions.get('window').width - spacing.md * 4);
const FALLBACK_TILE =
  SCREEN_CONTENT_WIDTH > 0
    ? (SCREEN_CONTENT_WIDTH - GRID_GAP * (COLUMNS - 1)) / COLUMNS
    : 96;

export function VehiclePhotosForm({
  photoUris,
  onAddPhotos,
  onRemovePhoto,
  onSetCoverPhoto,
  onSubmit,
  submitLabel,
  submitDisabled = false,
  loading = false,
}: VehiclePhotosFormProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  const remainingSlots = Math.max(0, MAX_VEHICLE_PHOTOS - photoUris.length);
  const canAddMore = remainingSlots > 0;
  const hasPhotos = photoUris.length > 0;
  const photosError =
    submitAttempted && !hasPhotos ? t('vehicles.errors.photosRequired') : undefined;

  const pickImages = async () => {
    if (!canAddMore) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const picked = result.assets
        .map((asset) => asset.uri)
        .filter((uri): uri is string => Boolean(uri))
        .slice(0, remainingSlots);
      if (picked.length === 0) {
        return;
      }
      const prepared = await Promise.all(
        picked.map(async (uri) => {
          try {
            return await prepareLocalImage(uri);
          } catch {
            return uri;
          }
        }),
      );
      setSubmitAttempted(false);
      onAddPhotos(prepared);
    }
  };

  const handleRemovePhoto = (index: number) => {
    onRemovePhoto(index);
  };

  const handleSubmit = () => {
    if (!hasPhotos || submitDisabled || loading) {
      setSubmitAttempted(true);
      return;
    }
    setSubmitAttempted(false);
    onSubmit();
  };

  // Relying on `aspectRatio` for square sizing is unreliable when a tile ends
  // up alone on the last flex-wrap row (e.g. an even photo count leaves the
  // add tile solo) — its height can fail to compute correctly. Measuring the
  // grid's actual width and setting explicit pixel width/height on every tile
  // sidesteps that entirely.
  const [gridWidth, setGridWidth] = React.useState(0);
  const tileSize =
    gridWidth > 0 ? (gridWidth - GRID_GAP * (COLUMNS - 1)) / COLUMNS : FALLBACK_TILE;
  const tileSizeStyle = { width: tileSize, height: tileSize };

  return (
    <AuthCard>
      <View style={styles.form}>
        <AppText weight="medium" style={styles.label}>
          {t('vehicles.photos.gridLabel')}
          <AppText style={styles.required}> *</AppText>
        </AppText>
        <AppText style={styles.countHint}>
          {t('vehicles.photos.countHint', {
            count: photoUris.length,
            max: MAX_VEHICLE_PHOTOS,
          })}
        </AppText>
        {hasPhotos ? (
          <AppText style={styles.coverHint}>{t('vehicles.photos.coverHint')}</AppText>
        ) : null}

        <View
          style={styles.grid}
          onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
        >
          {photoUris.map((uri, index) => {
            const isCover = index === 0;
            return (
              <Pressable
                key={`${uri}-${index}`}
                onPress={() => onSetCoverPhoto(index)}
                style={[
                  styles.gridItem,
                  tileSizeStyle,
                  isCover ? styles.coverTile : null,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isCover }}
                accessibilityLabel={
                  isCover
                    ? t('vehicles.photos.coverPhotoA11y', { number: index + 1 })
                    : t('vehicles.photos.setCoverA11y', { number: index + 1 })
                }
              >
                <Image source={{ uri }} style={styles.gridImage} contentFit="cover" />
                {isCover ? (
                  <View style={styles.coverBadge}>
                    <AppText weight="semibold" style={styles.coverBadgeText}>
                      {t('vehicles.photos.cover')}
                    </AppText>
                  </View>
                ) : null}
                <Pressable
                  onPress={() => handleRemovePhoto(index)}
                  style={styles.removeBadge}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t('vehicles.photos.removePhotoA11y', { number: index + 1 })}
                >
                  <FontAwesome name="times" size={10} color={colors.white} />
                </Pressable>
              </Pressable>
            );
          })}

          {canAddMore ? (
            <Pressable
              onPress={() => void pickImages()}
              style={[
                hasPhotos ? styles.gridItem : styles.addTileEmptyBox,
                styles.addTile,
                photosError && !hasPhotos ? styles.addTileError : null,
                hasPhotos ? tileSizeStyle : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('vehicles.photos.addPictures')}
              accessibilityHint={t('vehicles.photos.addPicturesHint')}
            >
              <View style={styles.addIconWrap}>
                <FontAwesome name="plus" size={16} color={colors.primary} />
              </View>
              {!hasPhotos ? (
                <AppText style={styles.addTileHint}>{t('vehicles.photos.addPictures')}</AppText>
              ) : null}
            </Pressable>
          ) : null}
        </View>
        {photosError ? <AppText style={styles.error}>{photosError}</AppText> : null}

        <Button
          label={submitLabel}
          onPress={handleSubmit}
          disabled={submitDisabled}
          loading={loading}
        />
      </View>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    color: colors.text.primary,
  },
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  countHint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: -spacing.xxs,
  },
  coverHint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: -spacing.xxs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.subtle,
  },
  coverTile: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  coverBadge: {
    position: 'absolute',
    left: spacing.xxs,
    bottom: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  coverBadgeText: {
    fontSize: 10,
    color: colors.white,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  removeBadge: {
    position: 'absolute',
    top: spacing.xxs,
    right: spacing.xxs,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 10, 10, 0.65)',
  },
  addTile: {
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTileError: {
    borderColor: colors.primary,
  },
  addTileEmptyBox: {
    width: '100%',
    height: 120,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.subtle,
    gap: spacing.xs,
  },
  addIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  addTileHint: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
  },
});
