import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

type VehiclePhotosFormProps = {
  photoUris: string[];
  onAddPhotos: (uris: string[]) => void;
  onRemovePhoto: (index: number) => void;
  onSubmit: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
  loading?: boolean;
};

const GRID_GAP = spacing.sm;

export function VehiclePhotosForm({
  photoUris,
  onAddPhotos,
  onRemovePhoto,
  onSubmit,
  submitLabel,
  submitDisabled = false,
  loading = false,
}: VehiclePhotosFormProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets
        .map((asset) => asset.uri)
        .filter((uri): uri is string => Boolean(uri));
      if (uris.length > 0) {
        onAddPhotos(uris);
      }
    }
  };

  const hasPhotos = photoUris.length > 0;

  // Relying on `aspectRatio` for square sizing is unreliable when a tile ends
  // up alone on the last flex-wrap row (e.g. an even photo count leaves the
  // add tile solo) — its height can fail to compute correctly. Measuring the
  // grid's actual width and setting explicit pixel width/height on every tile
  // sidesteps that entirely.
  const [gridWidth, setGridWidth] = React.useState(0);
  const tileSize = gridWidth > 0 ? (gridWidth - GRID_GAP) / 2 : null;
  const tileSizeStyle = tileSize ? { width: tileSize, height: tileSize } : null;

  return (
    <AuthCard>
      <View style={styles.form}>
        <AppText weight="medium" style={styles.label}>
          {t('vehicles.photos.gridLabel')}
          <AppText style={styles.required}> *</AppText>
        </AppText>

        <View
          style={styles.grid}
          onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
        >
          {photoUris.map((uri, index) => (
            <View key={`${uri}-${index}`} style={[styles.gridItem, tileSizeStyle]}>
              <Image source={{ uri }} style={styles.gridImage} contentFit="cover" />
              <Pressable
                onPress={() => onRemovePhoto(index)}
                style={styles.removeBadge}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('vehicles.photos.removePhotoA11y', { number: index + 1 })}
              >
                <FontAwesome name="times" size={10} color={colors.white} />
              </Pressable>
            </View>
          ))}

          <Pressable
            onPress={pickImages}
            style={[
              styles.gridItem,
              styles.addTile,
              hasPhotos ? tileSizeStyle : styles.addTileEmpty,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('vehicles.photos.addPictures')}
            accessibilityHint={t('vehicles.photos.addPicturesHint')}
          >
            <View style={styles.addIconWrap}>
              <FontAwesome name="plus" size={20} color={colors.primary} />
            </View>
            {!hasPhotos ? (
              <AppText style={styles.addTileHint}>{t('vehicles.photos.addPictures')}</AppText>
            ) : null}
          </Pressable>
        </View>

        <Button
          label={submitLabel}
          onPress={onSubmit}
          disabled={submitDisabled || !hasPhotos}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridItem: {
    width: '47.5%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.subtle,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  removeBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 28,
    height: 28,
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
  addTileEmpty: {
    width: '100%',
    aspectRatio: undefined,
    minHeight: 140,
    gap: spacing.xs,
  },
  addIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  addTileHint: {
    fontSize: 13,
    color: colors.text.secondary,
  },
});
