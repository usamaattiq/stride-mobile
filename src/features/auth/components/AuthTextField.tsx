import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { colors, radius, spacing } from '@/theme';
import { getFontFamily } from '@/theme/typography';

export type AuthTextFieldProps = TextInputProps & {
  label: string;
  optional?: boolean;
  error?: string;
};

export function AuthTextField({
  label,
  optional = false,
  error,
  style,
  ...rest
}: AuthTextFieldProps): React.ReactElement {
  const { currentLanguage } = useLanguage();

  return (
    <View style={styles.wrap}>
      <AppText weight="medium" style={styles.label}>
        {label}
        {optional ? (
          <AppText style={styles.optional}> (optional)</AppText>
        ) : null}
      </AppText>
      <TextInput
        placeholderTextColor={colors.text.tertiary}
        style={[
          styles.input,
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
  optional: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.text.primary,
  },
  inputError: {
    borderColor: colors.primary,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
  },
});
