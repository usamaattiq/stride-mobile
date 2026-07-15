import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
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
}: AuthScaffoldProps): React.ReactElement {
  const insets = useSafeAreaInsets();

  const body = scrollable ? (
    <ScrollView
      style={styles.cardScroll}
      contentContainerStyle={[styles.cardWrapScroll, contentWrapStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.cardOverlap}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.cardWrapStatic, contentWrapStyle]}>
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
            <AppText weight="bold" style={[styles.title, titleStyle]}>
              {title}
            </AppText>
            {subtitle ? (
              <AppText style={[styles.subtitle, subtitleStyle]}>{subtitle}</AppText>
            ) : null}
          </View>
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
    height: '36%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginTop: spacing.lg,
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
