import React from 'react';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Easing, StyleSheet, View, type DimensionValue } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { AppTopBar } from '@/shared/components/AppTopBar';
import { Button } from '@/shared/components/Button';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { colors, radius, spacing } from '@/theme';

const CREDITS = 50;

/** Decorative celebration confetti (purely visual). */
const CONFETTI: {
  top: number;
  left: DimensionValue;
  size: number;
  color: string;
  rotate: string;
}[] = [
  { top: 8, left: '12%', size: 12, color: '#F5A623', rotate: '20deg' },
  { top: 24, left: '30%', size: 9, color: '#2E90FA', rotate: '-15deg' },
  { top: 4, left: '52%', size: 11, color: '#12B76A', rotate: '40deg' },
  { top: 30, left: '72%', size: 10, color: '#EE46BC', rotate: '10deg' },
  { top: 12, left: '86%', size: 12, color: '#9E77ED', rotate: '-30deg' },
  { top: 60, left: '6%', size: 10, color: '#EE46BC', rotate: '-10deg' },
  { top: 74, left: '22%', size: 12, color: '#12B76A', rotate: '25deg' },
  { top: 88, left: '80%', size: 11, color: '#F5A623', rotate: '-20deg' },
  { top: 66, left: '64%', size: 9, color: '#2E90FA', rotate: '35deg' },
  { top: 108, left: '14%', size: 11, color: '#2E90FA', rotate: '15deg' },
  { top: 120, left: '90%', size: 10, color: '#12B76A', rotate: '-25deg' },
  { top: 132, left: '48%', size: 9, color: '#F5A623', rotate: '30deg' },
  { top: 150, left: '78%', size: 11, color: '#EE46BC', rotate: '-12deg' },
  { top: 158, left: '30%', size: 10, color: '#9E77ED', rotate: '18deg' },
];

type SignupSuccessScreenProps = {
  onGoToDashboard: () => void;
  onStartExploring: () => void;
};

export function SignupSuccessScreen({
  onGoToDashboard,
  onStartExploring,
}: SignupSuccessScreenProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const insets = useSafeAreaInsets();
  const badgeScale = React.useRef(new Animated.Value(0)).current;
  const contentOpacity = React.useRef(new Animated.Value(0)).current;
  const confettiAnims = React.useRef(CONFETTI.map(() => new Animated.Value(0))).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti holds for a beat, then drifts down and dissolves — like it's
    // celebrating the tick before settling.
    Animated.stagger(
      70,
      confettiAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 1600,
          delay: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [badgeScale, contentOpacity, confettiAnims]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" />

      <LinearGradient
        colors={[colors.primarySoft, colors.white]}
        style={styles.bgGradient}
        pointerEvents="none"
      />

      <AppTopBar left="none" showLanguageSwitcher includeSafeArea={false} />

      <View style={styles.confettiLayer} pointerEvents="none">
        {CONFETTI.map((piece, index) => {
          const anim = confettiAnims[index]!;
          const fallDistance = 90 + (index % 3) * 24;
          return (
            <Animated.View
              key={index}
              style={[
                styles.confettiPiece,
                {
                  top: piece.top,
                  left: piece.left,
                  width: piece.size,
                  height: piece.size * 0.5,
                  backgroundColor: piece.color,
                  opacity: anim.interpolate({
                    inputRange: [0, 0.6, 1],
                    outputRange: [1, 1, 0],
                  }),
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, fallDistance],
                      }),
                    },
                    { rotate: piece.rotate },
                  ],
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
          <FontAwesome name="check" size={34} color={colors.white} />
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity }}>
          <AppText weight="bold" style={styles.title}>
            {t('auth.signup.success.title')}
          </AppText>
          <AppText style={styles.subtitle}>{t('auth.signup.success.subtitle')}</AppText>

          <View style={styles.creditsCard}>
            <View style={styles.creditsCopy}>
              <AppText weight="semibold" style={styles.creditsLabel}>
                {t('auth.signup.success.creditsEarned')}
              </AppText>
              <AppText weight="bold" style={styles.creditsAmount}>
                {t('auth.signup.success.credits', { count: CREDITS })}
              </AppText>
              <AppText style={styles.creditsReason}>
                {t('auth.signup.success.creditsReason')}
              </AppText>
            </View>
            <FontAwesome5 name="coins" size={46} color="#E8A13A" />
          </View>
        </Animated.View>
      </View>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button label={t('auth.signup.success.dashboard')} onPress={onGoToDashboard} />
        <Button
          label={t('auth.signup.success.explore')}
          variant="secondary"
          onPress={onStartExploring}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    height: 220,
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 300,
    alignSelf: 'center',
  },
  creditsCard: {
    marginTop: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  creditsCopy: {
    flex: 1,
  },
  creditsLabel: {
    fontSize: 13,
    color: colors.primary,
  },
  creditsAmount: {
    marginTop: spacing.xxs,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text.primary,
  },
  creditsReason: {
    marginTop: spacing.xxs,
    fontSize: 13,
    color: colors.text.secondary,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
});
