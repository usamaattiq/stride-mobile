import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { getFontFamily } from '@/theme/typography';
import { onlyLatinDigits } from '@/shared/utils/latin-digits';

import { KeyboardDoneBar } from '@/shared/components/KeyboardDoneBar';

import { useKeyboardFocusScroll } from './AuthScaffold';

export type OtpInputProps = {
  length: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  secureTextEntry?: boolean;
  onFilled?: (value: string) => void;
};

export function OtpInput({
  length,
  value,
  onChange,
  autoFocus = false,
  secureTextEntry = false,
  onFilled,
}: OtpInputProps): React.ReactElement {
  const inputRef = React.useRef<TextInput>(null);
  const previousLengthRef = React.useRef(0);
  const accessoryId = React.useId();
  const [isFocused, setIsFocused] = React.useState(false);
  const handleKeyboardFocus = useKeyboardFocusScroll();
  const digits = onlyLatinDigits(value).slice(0, length);
  const digitFont = getFontFamily('en', 'regular');

  React.useEffect(() => {
    previousLengthRef.current = digits.length;
  }, [digits]);

  const handleChangeText = React.useCallback(
    (text: string) => {
      const next = onlyLatinDigits(text).slice(0, length);
      const prevLength = previousLengthRef.current;
      previousLengthRef.current = next.length;
      onChange(next);
      if (next.length === length && prevLength !== length) {
        onFilled?.(next);
      }
    },
    [length, onChange, onFilled],
  );

  const activeIndex = isFocused
    ? Math.min(digits.length, length - 1)
    : null;

  const handleDone = React.useCallback(() => {
    if (digits.length === length) {
      onFilled?.(digits);
    }
  }, [digits, length, onFilled]);

  return (
    <Pressable
      style={styles.wrap}
      onPress={() => inputRef.current?.focus()}
      accessibilityRole="none"
    >
      <View style={styles.row} pointerEvents="none">
        {Array.from({ length }).map((_, index) => {
          const char = digits[index] ?? '';
          const isActive = activeIndex === index;

          return (
            <View
              key={index}
              style={[
                styles.cell,
                char ? styles.cellFilled : null,
                isActive ? styles.cellFocused : null,
              ]}
            >
              <Text style={[styles.overlayDigit, { fontFamily: digitFont }]}>
                {char ? (secureTextEntry ? '•' : char) : ''}
              </Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={digits}
        onChangeText={handleChangeText}
        onFocus={(event) => {
          setIsFocused(true);
          handleKeyboardFocus(event);
        }}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={length}
        autoFocus={autoFocus}
        autoComplete={
          secureTextEntry ? 'off' : Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'
        }
        textContentType={secureTextEntry ? 'none' : 'oneTimeCode'}
        importantForAutofill={secureTextEntry ? 'no' : 'yes'}
        inputAccessoryViewID={accessoryId}
        caretHidden
        selectTextOnFocus={false}
        style={styles.hiddenInput}
      />

      <KeyboardDoneBar
        nativeID={accessoryId}
        disabled={digits.length !== length}
        onDone={handleDone}
      />
    </Pressable>
  );
}

const CELL_HEIGHT = 52;

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  cell: {
    flex: 1,
    height: CELL_HEIGHT,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cellFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  cellFocused: {
    borderColor: colors.primary,
  },
  overlayDigit: {
    fontSize: 22,
    // No lineHeight here on purpose: matching it to CELL_HEIGHT to "center"
    // the glyph relies on the font's line-box metrics, which iOS renders
    // inconsistently for custom fonts (glyph sits high/off-center). Instead
    // let the `cell` View's flexbox alignItems/justifyContent do the
    // centering against the actual rendered glyph.
    color: colors.text.primary,
    textAlign: 'center',
    // Digits are direction-neutral; pin LTR explicitly so an ambient RTL
    // (Arabic) text context can't shift how the single-char run is centered.
    writingDirection: 'ltr',
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    color: 'transparent',
    writingDirection: 'ltr',
  },
});
