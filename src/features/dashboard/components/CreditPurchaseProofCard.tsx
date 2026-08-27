import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';
import { cardBackShadow } from '@/theme/cardShadow';

type CreditPurchaseProofCardProps = {
  uri?: string | null;
  onPress?: () => void;
};

export function CreditPurchaseProofCard({
  uri,
  onPress,
}: CreditPurchaseProofCardProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const isRtl = I18nManager.isRTL;

  const body = (
    <LinearGradient
      colors={['#FFFFFF', '#FFFBFB', '#FFF4F2', '#FEE8E6', '#FED7D3']}
      locations={[0, 0.28, 0.52, 0.78, 1]}
      start={isRtl ? { x: 1, y: 0 } : { x: 0, y: 0 }}
      end={isRtl ? { x: 0, y: 1 } : { x: 1, y: 1 }}
      style={styles.inner}
    >
      <AppText weight="bold" style={styles.title}>
        {t('dashboard.home.proofLabel')}
      </AppText>
      <View style={[styles.preview, !uri && styles.previewEmpty]}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
        ) : (
          <FontAwesome name="plus" size={14} color={colors.primary} />
        )}
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.shadowGutter}>
      <View style={styles.card}>
        {onPress ? (
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.home.proofLabel')}
          >
            {body}
          </Pressable>
        ) : (
          body
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowGutter: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: 4,
    paddingBottom: 4,
  },
  card: {
    borderRadius: radius.md,
    ...cardBackShadow,
  },
  inner: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    overflow: 'hidden',
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: 15,
    color: colors.text.primary,
  },
  preview: {
    alignSelf: 'flex-start',
    width: 76,
    height: 76,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.subtle,
  },
  previewEmpty: {
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.92,
  },
});
