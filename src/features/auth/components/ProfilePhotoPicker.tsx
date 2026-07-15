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
  hint?: string;
};

export function ProfilePhotoPicker({
  uri,
  onChange,
  label = 'Profile photo',
  hint,
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
         {/* <View style={styles.info}> */}
        <AppText weight="medium" style={styles.label}>
          {label}
        </AppText>
        {/* {hint ? <AppText style={styles.hint}>{hint}</AppText> : null} */}
      {/* </View> */}
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
            <FontAwesome name="camera" size={20} color={colors.primary} />
          </View>
        )}
        <View style={styles.editBadge}>
          <FontAwesome name="pencil" size={10} color={colors.white} />
        </View>
      </Pressable>


    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    // flexDirection: 'row',
    // alignItems: 'center',
    gap: spacing.md,
  },
  avatarButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.primaryMuted,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 14,
    color: colors.text.primary,
  },
  hint: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});
