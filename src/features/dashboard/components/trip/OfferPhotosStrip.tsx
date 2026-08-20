import React from "react";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { i18n as appI18n } from "@/i18n";
import type { OfferAttachmentPhotos } from "@/services/api/rfqApi.types";
import { AppText } from "@/shared/components/AppText";
import { ImageGalleryModal } from "@/shared/components/ImageGalleryModal";
import { colors, radius, spacing } from "@/theme";

type OfferPhotosStripProps = {
  photos: OfferAttachmentPhotos | null | undefined;
};

/** Photos a responder attached instead of a vehicle on a sea/air request. */
export function OfferPhotosStrip({
  photos,
}: OfferPhotosStripProps): React.ReactElement | null {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [galleryIndex, setGalleryIndex] = React.useState<number | null>(null);

  const uris = photos?.photoDisplayUris?.length
    ? photos.photoDisplayUris
    : photos?.photoUrls;
  const objectKeys = photos?.photoUrls;
  if (!uris || uris.length === 0) {
    return null;
  }

  return (
    <View style={styles.root}>
      <AppText style={styles.label}>
        {t("dashboard.listings.detail.offer.photosAttached")}
      </AppText>
      <View style={styles.row}>
        {uris.map((uri, index) => {
          const recyclingKey = objectKeys?.[index] ?? `${index}`;
          return (
            <Pressable
              key={recyclingKey}
              onPress={() => setGalleryIndex(index)}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t(
                "dashboard.listings.detail.offer.photosViewA11y",
                {
                  number: index + 1,
                },
              )}
            >
              <Image
                source={{ uri }}
                style={styles.tileImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={recyclingKey}
                transition={0}
              />
            </Pressable>
          );
        })}
      </View>
      <ImageGalleryModal
        visible={galleryIndex != null}
        images={uris}
        initialIndex={galleryIndex ?? 0}
        onClose={() => setGalleryIndex(null)}
      />
    </View>
  );
}

const TILE_SIZE = 64;

const styles = StyleSheet.create({
  root: {
    gap: spacing.xxs,
  },
  label: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.background.subtle,
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  pressed: {
    opacity: 0.85,
  },
});
