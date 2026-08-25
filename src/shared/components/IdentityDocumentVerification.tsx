import React from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { DocumentUploadField } from '@/shared/components/DocumentUploadField';
import { KeyboardDoneBar } from '@/shared/components/KeyboardDoneBar';
import { toLatinDigits } from '@/shared/utils/latin-digits';
import {
  colors,
  getFontFamily,
  getInputFontFamily,
  isNumericKeyboardType,
  radius,
  spacing,
} from '@/theme';

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
  /** When true, shows submitted values without edit or submit actions. */
  readOnly?: boolean;
};

const GRID_GAP = spacing.sm;

/**
 * Shared NIC / driving-license form body (number + front/back images).
 * Embed inside AuthScaffold + AuthCard — same shell as personal verification.
 * Front/back tiles share one full-width row (2 equal columns).
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
  readOnly = false,
}: IdentityDocumentVerificationProps): React.ReactElement {
  const { currentLanguage } = useLanguage();
  const accessoryId = React.useId();
  const showDoneBar = keyboardType !== 'default';
  const canSubmit = !loading && Boolean(frontUri) && Boolean(backUri);
  const keepLatinDigits = isNumericKeyboardType(keyboardType);
  // Arabic placeholder must use Cairo; digit entry still prefers Outfit when numeric.
  const inputFontFamily = !documentNumber
    ? getFontFamily(currentLanguage, 'regular')
    : getInputFontFamily(currentLanguage, keepLatinDigits ? keyboardType : 'default');

  const handleChangeDocumentNumber = React.useCallback(
    (text: string) => {
      onChangeDocumentNumber(keepLatinDigits ? toLatinDigits(text) : text);
    },
    [keepLatinDigits, onChangeDocumentNumber],
  );

  const displayValue = keepLatinDigits ? toLatinDigits(documentNumber) : documentNumber;

  return (
    <View style={styles.fields}>
      <View style={styles.field}>
        <AppText weight="bold" style={styles.label}>
          {documentNumberLabel}
          {!readOnly ? <AppText style={styles.required}> *</AppText> : null}
        </AppText>
        <TextInput
          value={displayValue}
          onChangeText={handleChangeDocumentNumber}
          placeholder={documentNumberPlaceholder}
          placeholderTextColor={colors.text.tertiary}
          keyboardType={keyboardType}
          inputAccessoryViewID={showDoneBar && !readOnly ? accessoryId : undefined}
          editable={!readOnly}
          style={[
            styles.input,
            readOnly && styles.inputReadOnly,
            { fontFamily: inputFontFamily },
          ]}
        />
        {showDoneBar && !readOnly ? (
          <KeyboardDoneBar nativeID={accessoryId} disabled={!canSubmit} onDone={onSubmit} />
        ) : null}
      </View>

      <View style={styles.imagesRow}>
        <View style={styles.tileCol}>
          <DocumentUploadField
            label={frontLabel}
            required={!readOnly}
            dense
            tile
            uri={frontUri}
            onChange={onChangeFront}
            hint={uploadHint}
            changeHint={changeHint}
            readOnly={readOnly}
          />
        </View>
        <View style={styles.tileCol}>
          <DocumentUploadField
            label={backLabel}
            required={!readOnly}
            dense
            tile
            uri={backUri}
            onChange={onChangeBack}
            hint={uploadHint}
            changeHint={changeHint}
            readOnly={readOnly}
          />
        </View>
      </View>

      {errorMessage ? (
        <AppText style={styles.errorText}>{errorMessage}</AppText>
      ) : null}

      {!readOnly ? (
        <>
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
        </>
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
  inputReadOnly: {
    backgroundColor: colors.background.subtle,
    color: colors.text.secondary,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  tileCol: {
    flex: 1,
    minWidth: 0,
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
