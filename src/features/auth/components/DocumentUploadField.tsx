import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

type DocumentUploadFieldProps = {
  label: string;
  uri?: string | null;
  onChange: (uri: string | null) => void;
  hint?: string;
};

export function DocumentUploadField({
  label,
  uri,
  onChange,
  hint = 'Tap to upload image',
}: DocumentUploadFieldProps): React.ReactElement {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.wrap}>
      <AppText weight="medium" style={styles.label}>
        {label}
      </AppText>
      <Pressable
        onPress={pickImage}
        style={styles.box}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.preview} contentFit="cover" />
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
    height: 140,
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
