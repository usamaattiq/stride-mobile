import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { exitTripCreationToListings } from '@/features/dashboard/navigation/homeStackNavigation';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { colors, spacing } from '@/theme';

import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';

type Nav = NativeStackNavigationProp<DashboardRootStackParamList, 'TripPublishSuccess'>;

export function TripPublishSuccessScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const badgeScale = React.useRef(new Animated.Value(0)).current;
  const contentOpacity = React.useRef(new Animated.Value(0)).current;

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
  }, [badgeScale, contentOpacity]);

  const goToListings = React.useCallback(() => {
    exitTripCreationToListings(navigation);
  }, [navigation]);

  // Hardware back should behave the same as the CTA — there's nothing to go
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" />

      <LinearGradient
        colors={[colors.primarySoft, colors.white]}
        style={styles.bgGradient}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
          <FontAwesome name="check" size={34} color={colors.white} />
        </Animated.View>

        <Animated.View style={{ opacity: contentOpacity }}>
          <AppText weight="bold" style={styles.title}>
            {t('trips.create.successTitle')}
          </AppText>
          <AppText style={styles.subtitle}>{t('trips.create.successBody')}</AppText>
        </Animated.View>
      </View>

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button label={t('trips.create.showMyListings')} onPress={goToListings} />
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
    gap: spacing.md,
  },
});
