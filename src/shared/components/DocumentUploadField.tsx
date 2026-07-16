import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

// ID-1 card ratio (≈1.585) rounded to a clean value for the crop UI.
const DEFAULT_ASPECT: [number, number] = [16, 10];

export type DocumentUploadFieldProps = {
  label: string;
  uri?: string | null;
  onChange: (uri: string | null) => void;
  required?: boolean;
  /** Smaller label to match tighter forms. */
  dense?: boolean;
  hint?: string;
  /** Label shown over the preview once an image is selected. */
  changeHint?: string;
  /** Enable the native crop step after selecting an image. Defaults to true. */
  allowsEditing?: boolean;
  /** Crop aspect ratio (Android honors this; iOS uses its own crop UI). */
  aspect?: [number, number];
};

export function DocumentUploadField({
  label,
  uri,
  onChange,
  required = false,
  dense = false,
  hint = 'Tap to upload image',
  changeHint = 'Tap to change',
  allowsEditing = true,
  aspect = DEFAULT_ASPECT,
}: DocumentUploadFieldProps): React.ReactElement {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing,
      aspect,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.wrap}>
      <AppText
        weight={dense ? 'bold' : 'medium'}
        style={[styles.label, dense && styles.labelDense]}
      >
        {label}
        {required ? (
          <AppText style={[styles.required, dense && styles.requiredDense]}> *</AppText>
        ) : null}
      </AppText>
      <Pressable
        onPress={pickImage}
        style={styles.box}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {uri ? (
          <>
            <Image source={{ uri }} style={styles.preview} contentFit="cover" />
            <View style={styles.editBadge}>
              <FontAwesome name="crop" size={12} color={colors.white} />
              <AppText weight="medium" style={styles.editBadgeText}>
                {changeHint}
              </AppText>
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <FontAwesome name="cloud-upload" size={22} color={colors.primary} />
            <AppText style={styles.hint}>{hint}</AppText>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    color: colors.text.primary,
  },
  labelDense: {
    fontSize: 14,
  },
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  requiredDense: {
    fontSize: 14,
  },
  box: {
    minHeight: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
    backgroundColor: colors.background.subtle,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    aspectRatio: 16 / 10,
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
  editBadgeText: {
    fontSize: 11,
    color: colors.white,
  },
  empty: {
    flex: 1,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
  },
  hint: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
