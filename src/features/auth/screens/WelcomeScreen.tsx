import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { useLegalDocumentSheets } from '@/shared/hooks/useLegalDocumentSheets';
import { colors } from '@/theme';

import { WelcomeActions } from '../components/WelcomeActions';
import { WelcomeHero } from '../components/WelcomeHero';

export type WelcomeScreenProps = {
  onSignUp?: () => void;
  onLogIn?: () => void;
  onDashboard?: () => void;
};

export function WelcomeScreen({
  onSignUp,
  onLogIn,
  onDashboard,
}: WelcomeScreenProps) {
  const enterAnim = useRef(new Animated.Value(0)).current;
  const legalControl = useLegalDocumentSheets();

  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1,
      friction: 9,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [enterAnim]);

  return (
    <View style={styles.root} accessibilityLabel="Welcome screen">
      <FocusAwareStatusBar style="light" />
      <WelcomeHero enterAnim={enterAnim} />
      <WelcomeActions
        enterAnim={enterAnim}
        onSignUp={onSignUp}
        onLogIn={onLogIn}
        onDashboard={onDashboard}
        legalControl={legalControl}
      />
      {legalControl.legalSheets}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
});
