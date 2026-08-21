import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { toLatinDigits } from '@/shared/utils/latin-digits';
import { colors, getFontFamily, getInputFontFamily, isNumericKeyboardType, radius, spacing } from '@/theme';

import { useKeyboardFocusScroll } from './AuthScaffold';

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
  onChangeText,
  keyboardType,
  value,
  ...rest
}: AuthTextFieldProps): React.ReactElement {
  const { currentLanguage } = useLanguage();
  const handleFocus = useKeyboardFocusScroll(onFocus);
  const keepLatinDigits = isNumericKeyboardType(keyboardType);

  const handleChangeText = React.useCallback(
    (text: string) => {
      onChangeText?.(keepLatinDigits ? toLatinDigits(text) : text);
    },
    [keepLatinDigits, onChangeText],
  );

  const displayValue =
    keepLatinDigits && typeof value === 'string' ? toLatinDigits(value) : value;
  const isEmpty =
    displayValue == null || String(displayValue).length === 0;
  // Empty numeric fields still show Arabic placeholders — use Cairo then.
  const fontFamily = isEmpty
    ? getFontFamily(currentLanguage, 'regular')
    : getInputFontFamily(currentLanguage, keyboardType);

  return (
    <View style={styles.wrap}>
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
        placeholderTextColor={colors.text.tertiary}
        onFocus={handleFocus}
        keyboardType={keyboardType}
        {...rest}
        value={displayValue}
        onChangeText={handleChangeText}
        style={[
          styles.input,
          dense && styles.inputDense,
          error ? styles.inputError : null,
          { fontFamily },
          style,
        ]}
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
