import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  KeyboardProvider,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';
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

function BottomSheetFrame({
  onClose,
  children,
  heightRatio,
  sheetStyle,
}: {
  onClose: () => void;
  children: React.ReactNode;
  heightRatio: number;
  sheetStyle?: StyleProp<ViewStyle>;
}): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const clampedRatio = Math.min(0.95, Math.max(0.4, heightRatio));
  const baseHeight = windowHeight * clampedRatio;
  const closedPaddingBottom = Math.max(insets.bottom, spacing.sm);
  // Leave a little room under the status bar so the sheet never clips off-screen.
  const topReserve = Math.max(insets.top, spacing.md);

  const animatedSheetStyle = useAnimatedStyle(() => {
    // keyboardHeight is 0 when closed, -kb when open.
    const kb = Math.max(0, -keyboardHeight.value);
    return {
      // Sit flush above the keyboard instead of sliding the whole sheet off-screen.
      marginBottom: kb,
      height: Math.min(baseHeight, windowHeight - kb - topReserve),
      paddingBottom: kb > 0 ? spacing.sm : closedPaddingBottom,
    };
  });

  return (
    <View style={styles.modalRoot}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      />
      <Animated.View style={[styles.sheet, animatedSheetStyle, sheetStyle]}>
        <View style={styles.sheetInner}>{children}</View>
      </Animated.View>
    </View>
  );
}

export function AppBottomSheet({
  visible,
  onClose,
  children,
  heightRatio = 0.8,
  sheetStyle,
}: AppBottomSheetProps): React.ReactElement {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Nested provider so keyboard events work correctly inside RN Modal. */}
      <KeyboardProvider>
        <BottomSheetFrame onClose={onClose} heightRatio={heightRatio} sheetStyle={sheetStyle}>
          {children}
        </BottomSheetFrame>
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
