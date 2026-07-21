import React from 'react';
import {
  findNodeHandle,
  StyleSheet,
  TextInput,
  View,
  type FocusEvent,
  type TextInputProps,
} from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { colors, radius, spacing } from '@/theme';
import { getFontFamily } from '@/theme/typography';

import { useAuthScrollToInput } from './AuthScaffold';

export type AuthTextFieldProps = TextInputProps & {
  label: string;
  optional?: boolean;
  required?: boolean;
  /** Smaller label + input text for tighter forms. */
  dense?: boolean;
  error?: string;
};

export function AuthTextField({
  label,
  optional = false,
  required = false,
  dense = false,
  error,
  style,
  onFocus,
  onBlur,
  onChangeText,
  onContentSizeChange,
  ...rest
}: AuthTextFieldProps): React.ReactElement {
  const { currentLanguage } = useLanguage();
  const scrollToInput = useAuthScrollToInput();
  const inputRef = React.useRef<TextInput>(null);
  const isFocusedRef = React.useRef(false);

  const resyncFocusedScroll = React.useCallback(() => {
    if (!isFocusedRef.current) {
      return;
    }
    const nodeHandle = findNodeHandle(inputRef.current);
    if (nodeHandle != null) {
      scrollToInput(nodeHandle);
    }
  }, [scrollToInput]);

  const handleFocus = (event: FocusEvent) => {
    isFocusedRef.current = true;
    onFocus?.(event);
    scrollToInput(event.nativeEvent.target);
  };

  const handleBlur = (event: FocusEvent) => {
    isFocusedRef.current = false;
    onBlur?.(event);
  };

  return (
    <View style={styles.wrap} onLayout={resyncFocusedScroll}>
      <AppText
        weight={dense ? 'bold' : 'medium'}
        style={[styles.label, dense && styles.labelDense]}
      >
        {label}
        {required ? (
          <AppText style={[styles.required, dense && styles.requiredDense]}> *</AppText>
        ) : null}
        {optional ? (
          <AppText style={styles.optional}> (optional)</AppText>
        ) : null}
      </AppText>
      <TextInput
        ref={inputRef}
        placeholderTextColor={colors.text.tertiary}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChangeText={(text) => {
          onChangeText?.(text);
          resyncFocusedScroll();
        }}
        onContentSizeChange={(event) => {
          onContentSizeChange?.(event);
          resyncFocusedScroll();
        }}
        style={[
          styles.input,
          dense && styles.inputDense,
          error ? styles.inputError : null,
          { fontFamily: getFontFamily(currentLanguage, 'regular') },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <AppText style={styles.error}>{error}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    color: colors.text.primary,
  },
  labelDense: {
    fontSize: 14,
  },
  optional: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  requiredDense: {
    fontSize: 14,
  },
  input: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: 15,
    color: colors.text.primary,
  },
  inputDense: {
    minHeight: 42,
    fontSize: 13,
  },
  inputError: {
    borderColor: colors.primary,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
  },
});
