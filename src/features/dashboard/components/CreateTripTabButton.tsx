import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { colors, radius } from '@/theme';

export function CreateTripTabButton(props: BottomTabBarButtonProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { style, accessibilityState, ref: _ref, ...rest } = props;

  return (
    <Pressable
      {...rest}
      style={[style, styles.wrap]}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel={t('dashboard.tabs.createTripA11y')}
    >
      <View style={styles.button}>
        <FontAwesome name="plus" size={22} color={colors.white} />
      </View>
    </Pressable>
  );
}

const FAB_SIZE = 66;

const styles = StyleSheet.create({
  wrap: {
    top: -25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
});
