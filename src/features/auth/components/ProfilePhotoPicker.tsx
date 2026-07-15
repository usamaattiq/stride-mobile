import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { colors, spacing } from '@/theme';

type ProfilePhotoPickerProps = {
  uri?: string | null;
  onChange: (uri: string | null) => void;
  label?: string;
};

export function ProfilePhotoPicker({
  uri,
  onChange,
  label = 'Profile photo',
}: ProfilePhotoPickerProps): React.ReactElement {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
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
        style={styles.avatarButton}
        accessibilityRole="button"
        accessibilityLabel="Upload profile photo"
      >
        {uri ? (
          <Image source={{ uri }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <FontAwesome name="camera" size={22} color={colors.primary} />
            <AppText style={styles.placeholderText}>Add photo</AppText>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    color: colors.text.primary,
    alignSelf: 'flex-start',
  },
  avatarButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.primaryMuted,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  placeholderText: {
    fontSize: 11,
    color: colors.primary,
  },
});
