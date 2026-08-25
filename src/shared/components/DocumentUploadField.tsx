import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

export type DocumentUploadFieldProps = {
  label: string;
  uri?: string | null;
  onChange: (uri: string | null) => void;
  required?: boolean;
  /** Smaller label to match tighter forms. */
  dense?: boolean;
  /**
   * Square tile for multi-column grids (e.g. NIC front/back in a 2-col row).
   * Box fills the parent width with aspectRatio 1.
   */
  tile?: boolean;
  hint?: string;
  /** Label shown over the preview once an image is selected. */
  changeHint?: string;
  /** Accessibility label for the clear/remove control. */
  removeAccessibilityLabel?: string;
  /** When true, shows the current image without upload/remove actions. */
  readOnly?: boolean;
};

export function DocumentUploadField({
  label,
  uri,
  onChange,
  required = false,
  dense = false,
  tile = false,
  hint = 'Tap to upload image',
  changeHint = 'Tap to change',
  removeAccessibilityLabel = 'Remove',
  readOnly = false,
}: DocumentUploadFieldProps): React.ReactElement {
  const pickImage = async () => {
    // If the document-number field was still focused, its keyboard stays up
    // underneath the native picker and reopens on return, looking like the
    // field "randomly" refocused itself right after picking an image.
    Keyboard.dismiss();

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View style={[styles.wrap, tile && styles.wrapTile]}>
      <AppText
        weight={dense || tile ? 'bold' : 'medium'}
        style={[styles.label, dense && styles.labelDense, tile && styles.labelTile]}
        numberOfLines={tile ? 1 : undefined}
      >
        {label}
        {required ? (
          <AppText
            style={[
              styles.required,
              dense && styles.requiredDense,
              tile && styles.requiredTile,
            ]}
          >
            {' '}
            *
          </AppText>
        ) : null}
      </AppText>
      <View style={[styles.box, tile && styles.boxTile, readOnly && styles.boxReadOnly]}>
        {readOnly ? (
          uri ? (
            <Image source={{ uri }} style={styles.preview} contentFit="cover" />
          ) : (
            <View style={[styles.empty, tile && styles.emptyTile]}>
              <AppText style={[styles.hint, tile && styles.hintTile]} numberOfLines={tile ? 2 : undefined}>
                {hint}
              </AppText>
            </View>
          )
        ) : (
          <>
            <Pressable
              onPress={pickImage}
              style={styles.boxPress}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              {uri ? (
                <>
                  <Image source={{ uri }} style={styles.preview} contentFit="cover" />
                  <View style={[styles.editBadge, tile && styles.editBadgeTile]}>
                    <FontAwesome name="pencil" size={tile ? 10 : 12} color={colors.white} />
                    {tile ? null : (
                      <AppText weight="medium" style={styles.editBadgeText}>
                        {changeHint}
                      </AppText>
                    )}
                  </View>
                </>
              ) : (
                <View style={[styles.empty, tile && styles.emptyTile]}>
                  <FontAwesome
                    name="cloud-upload"
                    size={tile ? 18 : 22}
                    color={colors.primary}
                  />
                  <AppText
                    style={[styles.hint, tile && styles.hintTile]}
                    numberOfLines={tile ? 2 : undefined}
                  >
                    {hint}
                  </AppText>
                </View>
              )}
            </Pressable>

            {uri ? (
              <Pressable
                onPress={() => onChange(null)}
                style={[styles.removeBadge, tile && styles.removeBadgeTile]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={removeAccessibilityLabel}
              >
                <FontAwesome name="times" size={tile ? 10 : 12} color={colors.white} />
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  wrapTile: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    color: colors.text.primary,
  },
  labelDense: {
    fontSize: 14,
  },
  labelTile: {
    fontSize: 12,
  },
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  requiredDense: {
    fontSize: 14,
  },
  requiredTile: {
    fontSize: 12,
  },
  box: {
    height: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
    backgroundColor: colors.background.subtle,
    overflow: 'hidden',
  },
  boxTile: {
    height: undefined,
    width: '100%',
    aspectRatio: 1,
  },
  boxReadOnly: {
    borderStyle: 'solid',
    backgroundColor: colors.white,
  },
  boxPress: {
    ...StyleSheet.absoluteFillObject,
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
  },
  editBadge: {
    position: 'absolute',
    right: spacing.xs,
    bottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(10, 10, 10, 0.6)',
  },
  editBadgeTile: {
    right: spacing.xxs,
    bottom: spacing.xxs,
    paddingHorizontal: spacing.xxs,
    paddingVertical: spacing.xxs,
  },
  editBadgeText: {
    fontSize: 11,
    color: colors.white,
  },
  removeBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 10, 10, 0.65)',
  },
  removeBadgeTile: {
    top: spacing.xxs,
    right: spacing.xxs,
    width: 22,
    height: 22,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
  },
  emptyTile: {
    gap: spacing.xxs,
    padding: spacing.xs,
  },
  hint: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  hintTile: {
    fontSize: 10,
  },
});
