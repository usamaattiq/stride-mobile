import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Dimensions,
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

// Lets any field rendered inside the scrollable body (via AuthTextField, etc.)
// scroll itself above the keyboard on focus — RN's ScrollView doesn't do this
// automatically, see scrollResponderScrollNativeHandleToKeyboard.
const AuthScrollToInputContext = React.createContext<(nodeHandle: number) => void>(() => {});

export function useAuthScrollToInput(): (nodeHandle: number) => void {
  return React.useContext(AuthScrollToInputContext);
}

// Use the physical screen height (not 'window', which shrinks with the Android
// keyboard under softwareKeyboardLayoutMode: 'resize') so the header keeps a
// fixed height and never gets clipped when the keyboard opens.
const SCREEN_HEIGHT = Dimensions.get('screen').height;
const HEADER_HEIGHT_WITH_STEPPER = SCREEN_HEIGHT * 0.24;
const HEADER_HEIGHT_NO_STEPPER = SCREEN_HEIGHT * 0.19;

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
  const hasStepper = Boolean(stepCount && currentStep);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const scrollToInput = React.useCallback((nodeHandle: number) => {
    // Extra offset so the focused field lands with some breathing room above
    // the keyboard instead of touching it.
    scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard(
      nodeHandle,
      spacing.lg,
      true,
    );
  }, []);

  // Without the legal footer there's no bottom chrome, so pad for the safe area.
  const contentBottomPad = showLegalFooter
    ? spacing.xl
    : spacing.xl + Math.max(insets.bottom, spacing.xs);

  const body = scrollable ? (
    <ScrollView
      ref={scrollViewRef}
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
      <AuthScrollToInputContext.Provider value={scrollToInput}>
        <View style={styles.cardOverlap}>{children}</View>
      </AuthScrollToInputContext.Provider>
    </ScrollView>
  ) : (
    <View style={[styles.cardWrapStatic, { paddingBottom: contentBottomPad }, contentWrapStyle]}>
      <View style={styles.cardOverlap}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.root}>
        <View
          style={[
            styles.header,
            { height: hasStepper ? HEADER_HEIGHT_WITH_STEPPER : HEADER_HEIGHT_NO_STEPPER },
          ]}
        >
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
    // marginTop: spacing.md,
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
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xl,
  },
  cardWrapStatic: {
    flex: 1,
    paddingTop: 72,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  cardOverlap: {
    marginTop: -62,
  },
  legalFooter: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: 0,
  },
});
