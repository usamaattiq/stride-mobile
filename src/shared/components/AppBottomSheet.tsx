import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

export type AppBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Sheet height as a fraction of the window (0–1). Default 0.8. */
  heightRatio?: number;
  sheetStyle?: StyleProp<ViewStyle>;
};

export function AppBottomSheet({
  visible,
  onClose,
  children,
  heightRatio = 0.8,
  sheetStyle,
}: AppBottomSheetProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const clampedRatio = Math.min(0.95, Math.max(0.4, heightRatio));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardProvider>
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
          <View
            style={[
              styles.sheet,
              {
                height: `${Math.round(clampedRatio * 100)}%`,
                paddingBottom: Math.max(insets.bottom, spacing.sm),
              },
              sheetStyle,
            ]}
          >
            <KeyboardAvoidingView
              style={styles.sheetInner}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
            >
              {children}
            </KeyboardAvoidingView>
          </View>
        </View>
      </KeyboardProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.background.canvas,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    overflow: 'hidden',
  },
  sheetInner: {
    flex: 1,
  },
});
