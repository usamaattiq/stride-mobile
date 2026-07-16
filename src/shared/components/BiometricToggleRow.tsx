import React from 'react';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import type { DeviceBiometricKind } from '@/shared/hooks/useDeviceBiometric';
import { colors, radius, spacing } from '@/theme';

type BiometricToggleRowProps = {
  kind: DeviceBiometricKind;
  enabled: boolean;
  available: boolean;
  title: string;
  subtitle: string;
  onToggle: (enabled: boolean) => void;
};

/** Shared fingerprint / Face ID row used by signup security + settings. */
export function BiometricToggleRow({
  kind,
  enabled,
  available,
  title,
  subtitle,
  onToggle,
}: BiometricToggleRowProps): React.ReactElement {
  const isFace = kind === 'face';

  return (
    <Pressable
      style={styles.row}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
      onPress={() => onToggle(!enabled)}
    >
      <View style={styles.copy}>
        <View style={styles.iconWrap}>
          {isFace ? (
            <MaterialCommunityIcons
              name="face-recognition"
              size={20}
              color={colors.primary}
            />
          ) : (
            <FontAwesome5 name="fingerprint" size={18} color={colors.primary} solid />
          )}
        </View>
        <View style={styles.text}>
          <AppText weight="medium" style={styles.title}>
            {title}
          </AppText>
          <AppText style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </AppText>
        </View>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        disabled={!available && !enabled}
        trackColor={{ false: colors.border.default, true: colors.primaryDisabled }}
        thumbColor={enabled ? colors.primary : colors.white}
        style={styles.switch}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 14,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  switch: Platform.select({
    ios: { marginTop: -4 },
    default: {},
  }),
});
