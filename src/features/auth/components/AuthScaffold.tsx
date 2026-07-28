import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  View,
  type FocusEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/AppText';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { KeyboardAwareScrollView } from '@/shared/components/KeyboardAwareScrollView';
import { LegalLinks } from '@/shared/components/legal/LegalLinks';
import { LanguageSwitcher } from '@/shared/components/language-switcher';
import { useKeyboardVisible } from '@/shared/hooks/useKeyboardVisible';
import { colors, spacing } from '@/theme';

import { SignupStepIndicator } from './SignupStepIndicator';

/**
 * Legacy helper — keyboard-controller scrolls focused inputs automatically inside
 * `KeyboardAwareScrollView`. Keep chaining `onFocus` through this hook.
 */
export function useKeyboardFocusScroll(
  onFocus?: (event: FocusEvent) => void,
): (event: FocusEvent) => void {
  return React.useCallback(
    (event: FocusEvent) => {
      onFocus?.(event);
    },
    [onFocus],
  );
}

// Use the physical screen height (not 'window', which shrinks with the Android
// keyboard under softwareKeyboardLayoutMode: 'resize') so the header keeps a
// fixed height and never gets clipped when the keyboard opens.
const SCREEN_HEIGHT = Dimensions.get('screen').height;
const HEADER_HEIGHT_WITH_STEPPER = SCREEN_HEIGHT * 0.24;
const HEADER_HEIGHT_NO_STEPPER = SCREEN_HEIGHT * 0.19;

type AuthScaffoldProps = {
  /** Omit on tab roots where there is nowhere to go back. */
  onBack?: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  contentWrapStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  showLegalFooter?: boolean;
  /** Defaults to true. Set false on tab screens that already have language in Settings. */
  showLanguageSwitcher?: boolean;
  /** Optional control rendered on the right of the header top bar. */
  headerRight?: React.ReactNode;
  /**
   * Content-sized red header (matches Settings height) instead of the tall auth percentage height.
   */
  compactHeader?: boolean;
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
  showLanguageSwitcher = true,
  headerRight,
  compactHeader = false,
  stepCount,
  currentStep,
}: AuthScaffoldProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const hasStepper = Boolean(stepCount && currentStep);
  const isKeyboardVisible = useKeyboardVisible();
  const showTopBar =
    Boolean(onBack) || showLanguageSwitcher || headerRight != null;

  const contentBottomPad = showLegalFooter
    ? spacing.xl
    : spacing.xl + Math.max(insets.bottom, spacing.xs);

  const body = scrollable ? (
    <KeyboardAwareScrollView
      style={styles.cardScroll}
      contentContainerStyle={[
        compactHeader ? styles.cardWrapScrollCompact : styles.cardWrapScroll,
        { paddingBottom: contentBottomPad },
        contentWrapStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      {children}
    </KeyboardAwareScrollView>
  ) : (
    <View
      style={[
        compactHeader ? styles.cardWrapStaticCompact : styles.cardWrapStatic,
        { paddingBottom: contentBottomPad },
        contentWrapStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FocusAwareStatusBar style="light" />
      <View style={styles.root}>
        <View
          style={[
            styles.header,
            compactHeader ? styles.headerCompact : null,
            !compactHeader
              ? {
                  height: hasStepper
                    ? HEADER_HEIGHT_WITH_STEPPER
                    : HEADER_HEIGHT_NO_STEPPER,
                }
              : null,
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary]}
            style={StyleSheet.absoluteFill}
          />

          {showTopBar ? (
            <View style={[styles.topBar, !onBack && styles.topBarNoBack]}>
              {onBack ? (
                <Pressable
                  onPress={onBack}
                  style={styles.backButton}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <FontAwesome name="chevron-left" size={12} color="#FFFFFF" />
                </Pressable>
              ) : (
                <View style={styles.topBarSpacer} />
              )}

              <View style={styles.topBarRight}>
                {headerRight}
                {showLanguageSwitcher ? <LanguageSwitcher variant="glass" /> : null}
              </View>
            </View>
          ) : null}

          <View
            style={[
              styles.headerCopy,
              compactHeader ? styles.headerCopyCompact : null,
              !showTopBar && !compactHeader ? styles.headerCopyNoTopBar : null,
            ]}
          >
            <AppText
              weight="bold"
              style={[styles.title, compactHeader && styles.titleCompact, titleStyle]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {title}
            </AppText>
            {subtitle ? (
              <AppText
                style={[
                  styles.subtitle,
                  compactHeader && styles.subtitleCompact,
                  subtitleStyle,
                ]}
              >
                {subtitle}
              </AppText>
            ) : null}
          </View>

          {stepCount && currentStep ? (
            <View style={styles.stepSlot}>
              <SignupStepIndicator total={stepCount} current={currentStep} onBrand />
            </View>
          ) : null}
        </View>

        <View style={[styles.cardWrap, compactHeader && styles.cardWrapCompact]}>
          {body}
        </View>

        {showLegalFooter && !isKeyboardVisible ? (
          <LegalLinks
            containerStyle={[
              styles.legalFooter,
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  headerCompact: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarNoBack: {
    justifyContent: 'flex-end',
  },
  topBarSpacer: {
    width: 34,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepSlot: {
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
  headerCopyCompact: {
    marginTop: 0,
    minHeight: 0,
  },
  headerCopyNoTopBar: {
    marginTop: spacing.xs,
  },
  title: {
    color: colors.white,
    fontSize: 30,
    lineHeight: 36,
    maxWidth: 320,
  },
  titleCompact: {
    fontSize: 22,
    lineHeight: 28,
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.text.onBrandMuted,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
    maxWidth: 320,
  },
  subtitleCompact: {
    minHeight: 0,
    marginTop: 4,
  },
  cardWrap: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginTop: -spacing.sm,
  },
  cardWrapCompact: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -18,
  },
  cardScroll: {
    flex: 1,
  },
  cardWrapScroll: {
    flexGrow: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  cardWrapScrollCompact: {
    flexGrow: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  cardWrapStatic: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  cardWrapStaticCompact: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  legalFooter: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: 0,
  },
});
