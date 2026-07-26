import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

type PromoAdBannerProps = {
  onClose?: () => void;
};

export function PromoAdBanner({ onClose }: PromoAdBannerProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <LinearGradient
      colors={[colors.primarySoft, '#FFF1F0']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.root}
    >
      <FontAwesome5 name="bus" size={22} color={colors.primary} solid />
      <View style={styles.copy}>
        <AppText weight="bold" style={styles.title}>
          {t('dashboard.home.adTitle')}
        </AppText>
        <AppText style={styles.subtitle}>{t('dashboard.home.adSubtitle')}</AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
        onPress={onClose}
        hitSlop={8}
        style={styles.close}
      >
        <FontAwesome5 name="times" size={12} color={colors.text.tertiary} />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryMuted,
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: 13,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  close: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
