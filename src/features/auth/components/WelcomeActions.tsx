import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { Button } from '@/shared/components/Button';
import { LegalLinks } from '@/shared/components/legal/LegalLinks';
import type { LegalDocumentSheetControl } from '@/shared/hooks/useLegalDocumentSheets';
import { colors, spacing } from '@/theme';

type WelcomeActionsProps = {
  enterAnim: Animated.Value;
  onSignUp?: () => void;
  onLogIn?: () => void;
  onDashboard?: () => void;
  legalControl: LegalDocumentSheetControl;
};

export function WelcomeActions({
  enterAnim,
  onSignUp,
  onLogIn,
  onDashboard,
  legalControl,
}: WelcomeActionsProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, spacing.xs),
          opacity: enterAnim,
          transform: [
            {
              translateY: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [24, 0],
              }),
            },
            {
              scale: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.98, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.buttons}>
        <Button
          label={t('auth.welcome.signUp')}
          variant="primary"
          onPress={onSignUp}
          accessibilityHint="Create a new account"
        />
        <Button
          label={t('auth.welcome.logIn')}
          variant="secondary"
          onPress={onLogIn}
          accessibilityHint="Sign in to an existing account"
        />
        {/* <Button
          label={t('auth.welcome.dashboard')}
          variant="secondary"
          onPress={onDashboard}
          accessibilityHint="Open the dashboard"
        /> */}
      </View>

      <LegalLinks legalControl={legalControl} containerStyle={styles.legal} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.canvas,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  buttons: {
    gap: spacing.sm,
  },
  legal: {
    marginTop: spacing.sm,
  },
});
