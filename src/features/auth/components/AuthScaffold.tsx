import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/AppText';
import { LegalLinks } from '@/shared/components/legal/LegalLinks';
import { LanguageSwitcher } from '@/shared/components/language-switcher';
import { colors, spacing } from '@/theme';

import { SignupStepIndicator } from './SignupStepIndicator';

type AuthScaffoldProps = {
  onBack: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  contentWrapStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  showLegalFooter?: boolean;
  /** Total number of steps in the flow. Renders a step indicator when set. */
  stepCount?: number;
  /** The active step (1-based). Required alongside `stepCount`. */
  currentStep?: number;
};

export function AuthScaffold({
  onBack,
  title,
  subtitle,
  children,
  titleStyle,
  subtitleStyle,
  contentWrapStyle,
  scrollable = true,
  showLegalFooter = true,
  stepCount,
  currentStep,
}: AuthScaffoldProps): React.ReactElement {
  const insets = useSafeAreaInsets();

  // Without the legal footer there's no bottom chrome, so pad for the safe area.
  const contentBottomPad = showLegalFooter
    ? spacing.xl
    : spacing.xl + Math.max(insets.bottom, spacing.xs);

  const body = scrollable ? (
    <ScrollView
      style={styles.cardScroll}
      contentContainerStyle={[
        styles.cardWrapScroll,
        { paddingBottom: contentBottomPad },
        contentWrapStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
    >
      <View style={styles.cardOverlap}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.cardWrapStatic, { paddingBottom: contentBottomPad }, contentWrapStyle]}>
      <View style={styles.cardOverlap}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.root}>
        <View style={styles.header}>
          <LinearGradient
            colors={[colors.primary, colors.primary]}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.topBar}>
            <Pressable
              onPress={onBack}
              style={styles.backButton}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <FontAwesome name="chevron-left" size={12} color="#FFFFFF" />
            </Pressable>

            <LanguageSwitcher variant="glass" />
          </View>

          <View style={styles.headerCopy}>
            <AppText
              weight="bold"
              style={[styles.title, titleStyle]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {title}
            </AppText>
            {subtitle ? (
              <AppText style={[styles.subtitle, subtitleStyle]}>{subtitle}</AppText>
            ) : null}
          </View>

          {stepCount && currentStep ? (
            <View style={styles.stepSlot}>
              <SignupStepIndicator total={stepCount} current={currentStep} onBrand />
            </View>
          ) : null}
        </View>

        <View style={styles.cardWrap}>{body}</View>

        {showLegalFooter ? (
          <LegalLinks
            containerStyle={[
              styles.legalFooter,
              // Match Welcome: sit on the bottom safe-area edge
              { paddingBottom: Math.max(insets.bottom, spacing.xs) },
            ]}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    height: '30%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepSlot: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xxl,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerCopy: {
    marginTop: spacing.md,
    minHeight: 72,
  },
  title: {
    color: colors.white,
    fontSize: 30,
    lineHeight: 36,
    maxWidth: 320,
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.text.onBrandMuted,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
    maxWidth: 320,
  },
  cardWrap: {
    flex: 1,
    backgroundColor: colors.white,
  },
  cardScroll: {
    flex: 1,
  },
  cardWrapScroll: {
    flexGrow: 1,
    paddingTop: 72,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  cardWrapStatic: {
    flex: 1,
    paddingTop: 72,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  cardOverlap: {
    marginTop: -72,
  },
  legalFooter: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: 0,
  },
});
