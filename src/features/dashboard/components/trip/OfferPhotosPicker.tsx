import React from "react";
import { FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { i18n as appI18n } from "@/i18n";
import { AppText } from "@/shared/components/AppText";
import { colors, radius, spacing } from "@/theme";

export const MAX_OFFER_PHOTOS = 3;

type OfferPhotosPickerProps = {
  photoUris: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

export function OfferPhotosPicker({
  photoUris,
  onChange,
  disabled = false,
}: OfferPhotosPickerProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  const remainingSlots = Math.max(0, MAX_OFFER_PHOTOS - photoUris.length);
  const canAddMore = remainingSlots > 0 && !disabled;

  const pickImages = async () => {
    if (!canAddMore) {
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      allowsEditing: false,
      quality: 0.85,
    });
    if (result.canceled) {
      return;
    }
    const picked = result.assets
      .map((asset) => asset.uri)
      .filter((uri): uri is string => Boolean(uri))
      .slice(0, remainingSlots);
    if (picked.length > 0) {
      onChange([...photoUris, ...picked]);
    }
  };

  const removeAt = (index: number) => {
    onChange(photoUris.filter((_, current) => current !== index));
  };

  return (
    <View style={styles.root}>
      <AppText weight="semibold" style={styles.label}>
        {t("dashboard.listings.detail.offer.photosLabel")}
      </AppText>
      <AppText style={styles.hint}>
        {t("dashboard.listings.detail.offer.photosHint", {
          max: MAX_OFFER_PHOTOS,
        })}
      </AppText>
      <View style={styles.grid}>
        {photoUris.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.tile}>
            <Image
              source={{ uri }}
              style={styles.tileImage}
              contentFit="cover"
            />
            {disabled ? null : (
              <Pressable
                onPress={() => removeAt(index)}
                style={styles.removeBadge}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t("vehicles.photos.removePhotoA11y", {
                  number: index + 1,
                })}
              >
                <FontAwesome name="times" size={10} color={colors.white} />
              </Pressable>
            )}
          </View>
        ))}
        {canAddMore ? (
          <Pressable
            onPress={() => void pickImages()}
            style={({ pressed }) => [
              styles.tile,
              styles.addTile,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t("dashboard.listings.detail.offer.photosAdd")}
          >
            <FontAwesome name="plus" size={14} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const TILE_SIZE = 76;

const styles = StyleSheet.create({
  root: {
    gap: spacing.xxs,
  },
  label: {
    fontSize: 13,
    color: colors.text.primary,
  },
  hint: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingTop: spacing.xxs,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.subtle,
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  addTile: {
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.85,
  },
  removeBadge: {
    position: "absolute",
    top: spacing.xxs,
    right: spacing.xxs,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 10, 10, 0.65)",
  },
});
