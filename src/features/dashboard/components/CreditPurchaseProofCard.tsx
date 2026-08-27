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
  hint?: string;
};

export function CreditPurchaseProofCard({
  uri,
  onPress,
  hint,
}: CreditPurchaseProofCardProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const isRtl = I18nManager.isRTL;
  const label = t('dashboard.home.attachment');

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
      {hint ? <AppText style={styles.hint}>{hint}</AppText> : null}
      <View style={styles.preview}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <FontAwesome name="camera" size={16} color={colors.primary} />
          </View>
        )}
        <View style={styles.overlay}>
          <AppText weight="bold" style={styles.overlayText}>
            {label}
          </AppText>
        </View>
      </View>
      {onPress ? (
        <AppText weight="semibold" style={styles.cta}>
          {uri ? t('dashboard.home.changeProof') : t('dashboard.home.addProof')}
        </AppText>
      ) : null}
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
            accessibilityLabel={label}
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
  hint: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  preview: {
    alignSelf: 'flex-start',
    width: 112,
    height: 112,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  overlayText: {
    color: colors.white,
    fontSize: 12,
  },
  cta: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.92,
  },
});
