import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  BackHandler,
  Easing,
  Platform,
  StyleSheet,
  View,
  type DimensionValue,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useDashboardSession } from '@/features/dashboard/context/DashboardSessionContext';
import { exitTripCreationToListings } from '@/features/dashboard/navigation/homeStackNavigation';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppText } from '@/shared/components/AppText';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import {
  colors,
  iosArabicOpticalAlignStyle,
  radius,
  spacing,
  typography,
} from '@/theme';

import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';

const PREPARE_DURATION_MS = 3000;

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

type Nav = NativeStackNavigationProp<DashboardRootStackParamList, 'TripPublishSuccess'>;

export function TripPublishSuccessScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useDashboardSession();
  const isPassenger = user.role === 'passenger';

  const badgeScale = React.useRef(new Animated.Value(0)).current;
  const contentOpacity = React.useRef(new Animated.Value(0)).current;
  const prepareProgress = React.useRef(new Animated.Value(0)).current;
  const confettiAnims = React.useRef(CONFETTI.map(() => new Animated.Value(0))).current;
  const didNavigateRef = React.useRef(false);

  const goToListings = React.useCallback(() => {
    if (didNavigateRef.current) {
      return;
    }
    didNavigateRef.current = true;
    exitTripCreationToListings(navigation, { screen: 'MyListings' });
  }, [navigation]);

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

    Animated.stagger(
      70,
      confettiAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: PREPARE_DURATION_MS,
          delay: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [badgeScale, contentOpacity, confettiAnims]);

  React.useEffect(() => {
    prepareProgress.setValue(0);
    const animation = Animated.timing(prepareProgress, {
      toValue: 1,
      duration: PREPARE_DURATION_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (!finished) {
        return;
      }
      goToListings();
    });

    return () => {
      animation.stop();
    };
  }, [goToListings, prepareProgress]);

  // Hardware back should behave the same as auto-nav — there's nothing to go
  // "back" into, the trip is already published.
  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        goToListings();
        return true;
      });
      return () => sub.remove();
    }, [goToListings]),
  );

  const prepareWidth = prepareProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const prepareLabel = t('trips.create.preparingListings');

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" />

      <LinearGradient
        colors={[colors.primarySoft, colors.white]}
        style={styles.bgGradient}
        pointerEvents="none"
      />

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
            {t(isPassenger ? 'trips.create.successRequestTitle' : 'trips.create.successTitle')}
          </AppText>
          <AppText style={styles.subtitle}>
            {t(isPassenger ? 'trips.create.successRequestBody' : 'trips.create.successBody')}
          </AppText>
        </Animated.View>

        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View
            style={styles.prepareButton}
            accessibilityRole="progressbar"
            accessibilityLabel={prepareLabel}
            accessibilityState={{ busy: true }}
          >
            <Animated.View
              pointerEvents="none"
              style={[styles.prepareFill, { width: prepareWidth }]}
            />
            <AppText
              weight="bold"
              style={[
                styles.prepareLabel,
                Platform.OS === 'ios' && currentLanguage === 'ar'
                  ? iosArabicOpticalAlignStyle
                  : null,
              ]}
            >
              {prepareLabel}
            </AppText>
          </View>
        </View>
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
  actions: {
    alignSelf: 'stretch',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxxl,
    gap: spacing.md,
  },
  prepareButton: {
    minHeight: 56,
    borderRadius: radius.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    direction: 'ltr',
  },
  prepareFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  prepareLabel: {
    ...typography.button,
    color: colors.text.inverse,
    textAlign: 'center',
    zIndex: 1,
  },
});
