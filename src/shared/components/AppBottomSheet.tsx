import React from 'react';
import {
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type KeyboardEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
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

/**
 * Distance from the top of the IME to the bottom of the physical screen.
 * Using `height` alone is wrong on Android 3-button nav: the IME sits *above*
 * the nav bar, so `height` undershoots and footers stay in the keyboard.
 */
function keyboardOcclusion(event: KeyboardEvent): number {
  const screenH = Dimensions.get('screen').height;
  const { height, screenY } = event.endCoordinates;
  return Math.max(0, height, screenH - screenY);
}

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
  const keyboardOcclusionSv = useSharedValue(0);
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
  const topReserve = Math.max(insets.top, spacing.md);

  React.useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const applyShow = (event: KeyboardEvent) => {
      const next = keyboardOcclusion(event);
      const duration = Math.max(event.duration ?? 0, Platform.OS === 'ios' ? 1 : 0);
      keyboardOcclusionSv.value = duration > 0 ? withTiming(next, { duration }) : next;
    };
    const applyHide = (event: KeyboardEvent) => {
      const duration = Math.max(event.duration ?? 0, Platform.OS === 'ios' ? 1 : 0);
      keyboardOcclusionSv.value = duration > 0 ? withTiming(0, { duration }) : 0;
    };

    const show = Keyboard.addListener(showEvent, applyShow);
    const hide = Keyboard.addListener(hideEvent, applyHide);
    const frame =
      Platform.OS === 'android'
        ? Keyboard.addListener('keyboardDidChangeFrame', (event) => {
            const next = keyboardOcclusion(event);
            keyboardOcclusionSv.value = next < 1 ? 0 : next;
          })
        : null;

    return () => {
      show.remove();
      hide.remove();
      frame?.remove();
    };
  }, [keyboardOcclusionSv]);

  React.useEffect(() => {
    if (lastWidthRef.current !== width) {
      lastWidthRef.current = width;
      layoutHeight.value = windowHeight;
      return;
    }
    if (windowHeight >= layoutHeight.value) {
      layoutHeight.value = windowHeight;
    }
  }, [layoutHeight, width, windowHeight]);

  const animatedSheetStyle = useAnimatedStyle(() => {
    const lift = Math.max(0, keyboardOcclusionSv.value);
    const open = lift > 1;
    const fullH = layoutHeight.value;
    // Shrink the sheet into the remaining space so the inner ScrollView keeps
    // a real height and can scroll; do not let the sheet overflow under the IME.
    const maxHeight = Math.min(fullH * clampedRatio, Math.max(fullH - lift - topReserve, fullH * 0.32));
    return {
      marginBottom: lift,
      height: maxHeight,
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
      <SafeAreaProvider initialMetrics={initialWindowMetrics ?? undefined}>
        <BottomSheetFrame onClose={onClose} heightRatio={heightRatio} sheetStyle={sheetStyle}>
          {children}
        </BottomSheetFrame>
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
    minHeight: 0,
  },
});
