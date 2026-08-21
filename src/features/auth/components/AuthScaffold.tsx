import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Dimensions,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  type FocusEvent,
  type RefreshControlProps,
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

// Use the physical screen height (not 'window', which would shrink with the
// Android keyboard under softwareKeyboardLayoutMode: 'resize' — deliberately
// not used, see app.json) so the header keeps a fixed height regardless.
const SCREEN_HEIGHT = Dimensions.get('screen').height;
const HEADER_HEIGHT_WITH_STEPPER = SCREEN_HEIGHT * 0.24;
const HEADER_HEIGHT_NO_STEPPER = SCREEN_HEIGHT * 0.20;

type AuthScaffoldProps = {
  /** Omit on tab roots where there is nowhere to go back. */
  onBack?: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  contentWrapStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  cardWrapStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  showLegalFooter?: boolean;
  /** Defaults to true. Set false on tab screens that already have language in Settings. */
  showLanguageSwitcher?: boolean;
  /** Optional control rendered on the right of the header top bar. */
  headerRight?: React.ReactNode;
  /** Optional content rendered in the red header below the title/subtitle. */
  headerExtra?: React.ReactNode;
  /**
   * Content-sized red header (matches Settings height) instead of the tall auth percentage height.
   */
  compactHeader?: boolean;
  /** Places the title centered on the same row as the back button. */
  centerTitleInTopBar?: boolean;
  /** Total number of steps in the flow. Renders a step indicator when set. */
  stepCount?: number;
  /** The active step (1-based). Required alongside `stepCount`. */
  currentStep?: number;
  /**
   * Extra space kept between a focused input and the keyboard, forwarded to the
   * scrollable body. Bump this on screens with dropdowns/panels that render below a
   * field (e.g. city search results) so they aren't left hidden under the keyboard.
   */
  scrollBottomOffset?: number;
  /** Extra scroll padding while the keyboard is open (keyboard-controller). */
  extraKeyboardSpace?: number;
  /** Optional pull-to-refresh props for the scrollable body. */
  refreshControlProps?: RefreshControlProps;
  /** Pinned below the scroll body (e.g. auction bid composer). */
  footer?: React.ReactNode;
};

export function AuthScaffold({
  onBack,
  title,
  subtitle,
  children,
  titleStyle,
  subtitleStyle,
  contentWrapStyle,
  headerStyle,
  cardWrapStyle,
  scrollable = true,
  showLegalFooter = true,
  showLanguageSwitcher = true,
  headerRight,
  headerExtra,
  compactHeader = false,
  centerTitleInTopBar = false,
  stepCount,
  currentStep,
  scrollBottomOffset,
  extraKeyboardSpace,
  refreshControlProps,
  footer,
}: AuthScaffoldProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const hasStepper = Boolean(stepCount && currentStep);
  const isKeyboardVisible = useKeyboardVisible();
  const showTopBar =
    Boolean(onBack) || showLanguageSwitcher || headerRight != null;

  const contentBottomPad = showLegalFooter
    ? spacing.xl
    : spacing.xl + Math.max(insets.bottom, spacing.xs);

  const bodyPad = footer ? spacing.lg : contentBottomPad;

  const showTitleInTopBar = centerTitleInTopBar && Boolean(title);
  const showTitleInHeaderCopy = Boolean(title) && !showTitleInTopBar;

  const body = scrollable ? (
    <KeyboardAwareScrollView
      style={styles.cardScroll}
      contentContainerStyle={[
        compactHeader ? styles.cardWrapScrollCompact : styles.cardWrapScroll,
        { paddingBottom: bodyPad },
        contentWrapStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      {...(scrollBottomOffset != null ? { bottomOffset: scrollBottomOffset } : {})}
      extraKeyboardSpace={extraKeyboardSpace}
      refreshControl={
        refreshControlProps ? <RefreshControl {...refreshControlProps} /> : undefined
      }
    >
      {children}
    </KeyboardAwareScrollView>
  ) : (
    <View
      style={[
        compactHeader ? styles.cardWrapStaticCompact : styles.cardWrapStatic,
        { paddingBottom: bodyPad },
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
            compactHeader && centerTitleInTopBar ? styles.headerCompactCenteredTitle : null,
            !compactHeader
              ? {
                  height: hasStepper
                    ? HEADER_HEIGHT_WITH_STEPPER
                    : HEADER_HEIGHT_NO_STEPPER,
                }
              : null,
            headerStyle,
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

              {showTitleInTopBar ? (
                <View style={styles.topBarCenter} pointerEvents="none">
                  <AppText
                    weight="semibold"
                    style={[styles.topBarTitle, titleStyle]}
                    numberOfLines={1}
                  >
                    {title}
                  </AppText>
                </View>
              ) : null}

              <View style={styles.topBarRight}>
                {headerRight}
                {showLanguageSwitcher ? <LanguageSwitcher variant="glass" /> : null}
                {showTitleInTopBar && !headerRight && !showLanguageSwitcher ? (
                  <View style={styles.topBarSpacer} />
                ) : null}
              </View>
            </View>
          ) : null}

          {showTitleInHeaderCopy || subtitle ? (
            <View
              style={[
                styles.headerCopy,
                compactHeader ? styles.headerCopyCompact : null,
                !showTopBar && !compactHeader ? styles.headerCopyNoTopBar : null,
              ]}
            >
              {showTitleInHeaderCopy ? (
                <AppText
                  weight="bold"
                  style={[styles.title, compactHeader && styles.titleCompact, titleStyle]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {title}
                </AppText>
              ) : null}
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
          ) : null}

          {stepCount && currentStep ? (
            <View style={styles.stepSlot}>
              <SignupStepIndicator total={stepCount} current={currentStep} onBrand />
            </View>
          ) : null}

          {headerExtra ? <View style={styles.headerExtra}>{headerExtra}</View> : null}
        </View>

        <View style={[styles.cardWrap, compactHeader && styles.cardWrapCompact, cardWrapStyle]}>
          {body}
          {footer ? (
            <View
              style={[
                styles.screenFooter,
                { paddingBottom: Math.max(insets.bottom, spacing.sm) },
              ]}
            >
              {footer}
            </View>
          ) : null}
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
  headerCompactCenteredTitle: {
    // paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  topBarNoBack: {
    justifyContent: 'flex-end',
  },
  topBarCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl + spacing.sm,
  },
  topBarTitle: {
    color: colors.white,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: '100%',
  },
  topBarSpacer: {
    width: 34,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    zIndex: 1,
  },
  stepSlot: {
    marginHorizontal: spacing.xxl,
  },
  headerExtra: {
    marginTop: spacing.sm,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    zIndex: 1,
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
    overflow: 'hidden',
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
  screenFooter: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  legalFooter: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: 0,
  },
});
