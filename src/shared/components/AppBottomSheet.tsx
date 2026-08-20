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
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import {
  KeyboardProvider,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';
import {
  initialWindowMetrics,
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

/** Floor so 3-button / gesture nav never sits under sheet content when insets lag. */
const MIN_BOTTOM_INSET = 24;

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
  const { width, height: windowHeight } = useWindowDimensions();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const layoutHeight = useSharedValue(windowHeight);
  const lastWidthRef = React.useRef(width);
  const clampedRatio = Math.min(0.95, Math.max(0.22, heightRatio));
  const fallbackBottom = initialWindowMetrics?.insets.bottom ?? 0;
  const closedPaddingBottom = Math.max(
    insets.bottom,
    fallbackBottom,
    MIN_BOTTOM_INSET,
    spacing.sm,
  );
  // Leave a little room under the status bar so the sheet never clips off-screen.
  const topReserve = Math.max(insets.top, spacing.md);

  React.useEffect(() => {
    if (lastWidthRef.current !== width) {
      lastWidthRef.current = width;
      layoutHeight.value = windowHeight;
      return;
    }
    // iOS can shrink window height while the keyboard is open — keep the full height.
    if (windowHeight >= layoutHeight.value) {
      layoutHeight.value = windowHeight;
    }
  }, [layoutHeight, width, windowHeight]);

  const animatedSheetStyle = useAnimatedStyle(() => {
    const kb = Math.max(0, Math.abs(keyboardHeight.value));
    const open = kb > 1;
    const lift = open ? kb : 0;
    const fullH = layoutHeight.value;
    const maxHeight = Math.min(fullH * clampedRatio, fullH - lift - topReserve);
    return {
      marginBottom: lift,
      height: maxHeight,
      // Keyboard already covers the home indicator — extra padding leaves a hole above it.
      paddingBottom: open ? 0 : closedPaddingBottom,
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
  heightRatio = 0.85,
  sheetStyle,
}: AppBottomSheetProps): React.ReactElement {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      {/* Modal renders outside the app SafeArea tree — nest a provider so insets work. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics ?? undefined}>
        <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
          <BottomSheetFrame onClose={onClose} heightRatio={heightRatio} sheetStyle={sheetStyle}>
            {children}
          </BottomSheetFrame>
        </KeyboardProvider>
      </SafeAreaProvider>
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
