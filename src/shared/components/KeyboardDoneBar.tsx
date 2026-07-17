import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { i18n as appI18n } from '@/i18n';
import { colors, spacing } from '@/theme';

import { AppText } from './AppText';

export type KeyboardDoneBarProps = {
  nativeID: string;
  /** Done is only tappable once the field (and its action) is valid. */
  disabled?: boolean;
  /** Called after the keyboard is dismissed, e.g. to advance/submit like the screen's own CTA. */
  onDone?: () => void;
};

/**
 * iOS only: number-pad / phone-pad keyboards have no return key, so there's
 * no built-in way to dismiss them. Pair with `inputAccessoryViewID={nativeID}`
 * on the TextInput. No-op on Android, which already dismisses via the back button.
 */
export function KeyboardDoneBar({
  nativeID,
  disabled = false,
  onDone,
}: KeyboardDoneBarProps): React.ReactElement | null {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={styles.bar}>
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            onDone?.();
          }}
          disabled={disabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
        >
          <AppText weight="semibold" style={[styles.doneText, disabled && styles.doneTextDisabled]}>
            {t('common.done')}
          </AppText>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.subtle,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  doneText: {
    fontSize: 16,
    color: colors.primary,
  },
  doneTextDisabled: {
    color: colors.text.tertiary,
  },
});
