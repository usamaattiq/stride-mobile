import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import { useDashboardSession } from '@/features/dashboard/context/DashboardSessionContext';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';
import { getFontFamily } from '@/theme/typography';

export function CreateTripTabButton(props: BottomTabBarButtonProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const { user } = useDashboardSession();
  const { style, accessibilityState, ref: _ref, ...rest } = props;
  const isPassenger = user.role === 'passenger';
  const label = t(isPassenger ? 'dashboard.tabs.CreateRequest' : 'dashboard.tabs.CreateTrip');
  const a11yLabel = t(
    isPassenger ? 'dashboard.tabs.createRequestA11y' : 'dashboard.tabs.createTripA11y',
  );

  return (
    <Pressable
      {...rest}
      style={[style, styles.wrap]}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel={a11yLabel}
    >
      <View style={styles.button}>
        <FontAwesome name="plus" size={26} color={colors.white} />
      </View>
      <AppText
        weight="medium"
        style={[styles.label, { fontFamily: getFontFamily(currentLanguage, 'medium') }]}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const FAB_SIZE = 62;

const styles = StyleSheet.create({
  wrap: {
    top: -30,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
  },
  button: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  label: {
    marginTop: spacing.xxs,
    fontSize: 11,
    lineHeight: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
