import React from 'react';
import { Platform, type ScrollView, type ScrollViewProps } from 'react-native';
import {
  KeyboardAwareScrollView as ControllerKeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps as ControllerProps,
} from 'react-native-keyboard-controller';

import { spacing } from '@/theme';

/** Gap kept between the focused field and the keyboard. */
const DEFAULT_BOTTOM_OFFSET = spacing.huge;
/**
 * Android uses window `pan`, so extra space double-shifts the form off-screen.
 * iOS only needs a little room so the last field can scroll above the keyboard.
 */
const DEFAULT_EXTRA_KEYBOARD_SPACE = Platform.OS === 'ios' ? spacing.lg : spacing.md;

export type KeyboardAwareScrollViewProps = ScrollViewProps &
  Partial<
    Pick<
      ControllerProps,
      'bottomOffset' | 'disableScrollOnKeyboardHide' | 'extraKeyboardSpace' | 'enabled'
    >
  >;

export const KeyboardAwareScrollView = React.forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
  function KeyboardAwareScrollView(
    {
      bottomOffset = DEFAULT_BOTTOM_OFFSET,
      extraKeyboardSpace = DEFAULT_EXTRA_KEYBOARD_SPACE,
      keyboardShouldPersistTaps = 'handled',
      keyboardDismissMode = 'interactive',
      showsVerticalScrollIndicator = false,
      children,
      ...props
    },
    ref,
  ): React.ReactElement {
    return (
      <ControllerKeyboardAwareScrollView
        ref={ref}
        bottomOffset={bottomOffset}
        extraKeyboardSpace={extraKeyboardSpace}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={keyboardDismissMode}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        overScrollMode="never"
        {...props}
      >
        {children}
      </ControllerKeyboardAwareScrollView>
    );
  },
);
