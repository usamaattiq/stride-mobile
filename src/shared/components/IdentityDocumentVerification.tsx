import React from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { DocumentUploadField } from '@/shared/components/DocumentUploadField';
import { KeyboardDoneBar } from '@/shared/components/KeyboardDoneBar';
import { colors, getFontFamily, radius, spacing } from '@/theme';

export type IdentityDocumentVerificationProps = {
  documentNumber: string;
  documentNumberLabel: string;
  documentNumberPlaceholder: string;
  frontUri: string | null;
  backUri: string | null;
  frontLabel: string;
  backLabel: string;
  uploadHint: string;
  changeHint: string;
  submitLabel: string;
  skipLabel?: string;
  onChangeDocumentNumber: (value: string) => void;
  onChangeFront: (uri: string | null) => void;
  onChangeBack: (uri: string | null) => void;
  onSubmit: () => void;
  onSkip?: () => void;
  keyboardType?: KeyboardTypeOptions;
  loading?: boolean;
  errorMessage?: string | null;
};

/**
 * Shared NIC / driving-license form body (number + front/back images).
 * Embed inside AuthScaffold + AuthCard — same shell as personal verification.
 */
export function IdentityDocumentVerification({
  documentNumber,
  documentNumberLabel,
  documentNumberPlaceholder,
  frontUri,
  backUri,
  frontLabel,
  backLabel,
  uploadHint,
  changeHint,
  submitLabel,
  skipLabel,
  onChangeDocumentNumber,
  onChangeFront,
  onChangeBack,
  onSubmit,
  onSkip,
  keyboardType = 'default',
  loading = false,
  errorMessage = null,
}: IdentityDocumentVerificationProps): React.ReactElement {
  const accessoryId = React.useId();
  const showDoneBar = keyboardType !== 'default';
  const canSubmit = !loading && Boolean(frontUri) && Boolean(backUri);

  return (
    <View style={styles.fields}>
      <View style={styles.field}>
        <AppText weight="bold" style={styles.label}>
          {documentNumberLabel}
          <AppText style={styles.required}> *</AppText>
        </AppText>
        <TextInput
          value={documentNumber}
          onChangeText={onChangeDocumentNumber}
          placeholder={documentNumberPlaceholder}
          placeholderTextColor={colors.text.tertiary}
          keyboardType={keyboardType}
          inputAccessoryViewID={showDoneBar ? accessoryId : undefined}
          style={[
            styles.input,
            // Document IDs are digit-heavy; Outfit keeps Latin numerals centered on iOS Arabic.
            { fontFamily: getFontFamily('en', 'regular') },
          ]}
        />
        {showDoneBar ? (
          <KeyboardDoneBar nativeID={accessoryId} disabled={!canSubmit} onDone={onSubmit} />
        ) : null}
      </View>

      <DocumentUploadField
        label={frontLabel}
        required
        dense
        uri={frontUri}
        onChange={onChangeFront}
        hint={uploadHint}
        changeHint={changeHint}
      />
      <DocumentUploadField
        label={backLabel}
        required
        dense
        uri={backUri}
        onChange={onChangeBack}
        hint={uploadHint}
        changeHint={changeHint}
      />

      {errorMessage ? (
        <AppText style={styles.errorText}>{errorMessage}</AppText>
      ) : null}

      <Button
        label={submitLabel}
        onPress={onSubmit}
        disabled={!canSubmit}
        loading={loading}
      />

      {onSkip && skipLabel ? (
        <Pressable
          onPress={onSkip}
          style={styles.skip}
          hitSlop={8}
          disabled={loading}
          accessibilityState={{ disabled: loading }}
        >
          <AppText
            weight="semibold"
            style={[styles.skipText, loading && styles.skipTextDisabled]}
          >
            {skipLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: spacing.sm,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    color: colors.text.primary,
  },
  required: {
    fontSize: 14,
    color: colors.primary,
  },
  input: {
    minHeight: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: 13,
    color: colors.text.primary,
  },
  skip: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  skipText: {
    fontSize: 13,
    color: colors.primary,
  },
  skipTextDisabled: {
    color: colors.text.tertiary,
  },
  errorText: {
    fontSize: 12,
    color: colors.primary,
  },
});
