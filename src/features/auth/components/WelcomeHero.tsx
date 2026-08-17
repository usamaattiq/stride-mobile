import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppText } from '@/shared/components/AppText';
import { AppTopBar } from '@/shared/components/AppTopBar';
import { colors, spacing, typography } from '@/theme';

const WELCOME_HERO_IMAGE = require('@/assets/images/welcome-hero.jpg');

type WelcomeHeroProps = {
  enterAnim: Animated.Value;
};

export function WelcomeHero({ enterAnim }: WelcomeHeroProps) {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { isRTL } = useLanguage();
  const { width, height } = useWindowDimensions();
  const isCompact = height < 700 || width < 360;
  const imageOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [imageOpacity]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: enterAnim,
          transform: [
            {
              translateY: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-12, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}>
        <Image
          source={WELCOME_HERO_IMAGE}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={400}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>

      <LinearGradient
        colors={[
          colors.overlay.heroTop,
          colors.overlay.heroMid,
          colors.overlay.heroBottom,
        ]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <AppTopBar
          variant="onImage"
          left="logo"
          brandName={t('auth.welcome.brandName')}
          includeSafeArea
          style={styles.topBar}
        />

        <View style={[styles.copyBlock, isRTL && styles.copyBlockRtl]}>
          <AppText
            weight="bold"
            accessibilityRole="header"
            style={[
              styles.title,
              isCompact && styles.titleCompact,
              isRTL && styles.textRtl,
            ]}
            maxFontSizeMultiplier={1.35}
          >
            {t('auth.welcome.title')}
          </AppText>
          <AppText
            weight="regular"
            style={[
              styles.subtitle,
              isCompact && styles.subtitleCompact,
              isRTL && styles.textRtl,
            ]}
            maxFontSizeMultiplier={1.4}
          >
            {t('auth.welcome.subtitle')}
          </AppText>
          <AppText
            weight="regular"
            style={[styles.credit, isRTL && styles.textRtl]}
            accessibilityLabel={t('auth.welcome.photoCredit')}
          >
            {t('auth.welcome.photoCredit')}
          </AppText>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: 280,
    overflow: 'hidden',
    backgroundColor: colors.black,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  topBar: {
    paddingHorizontal: spacing.xl,
  },
  copyBlock: {
    gap: spacing.sm,
    maxWidth: 360,
    paddingHorizontal: spacing.xl,
  },
  copyBlockRtl: {
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  textRtl: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  title: {
    ...typography.heroTitle,
    color: colors.text.inverse,
  },
  titleCompact: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    ...typography.heroSubtitle,
    color: colors.text.inverseMuted,
  },
  subtitleCompact: {
    fontSize: 15,
    lineHeight: 22,
  },
  credit: {
    ...typography.photoCredit,
    color: colors.text.onImageMuted,
    marginTop: spacing.xs,
  },
});
