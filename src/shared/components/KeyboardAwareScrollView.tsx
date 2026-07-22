import React from 'react';
import type { ScrollView, ScrollViewProps } from 'react-native';
import {
  KeyboardAwareScrollView as ControllerKeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps as ControllerProps,
} from 'react-native-keyboard-controller';

import { spacing } from '@/theme';

const DEFAULT_BOTTOM_OFFSET = spacing.md;

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
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={keyboardDismissMode}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        {...props}
      >
        {children}
      </ControllerKeyboardAwareScrollView>
    );
  },
);
