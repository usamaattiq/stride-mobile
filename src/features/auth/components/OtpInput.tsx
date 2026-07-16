import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { getFontFamily } from '@/theme/typography';

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
  const inputRefs = React.useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
  const handleKeyboardFocus = useKeyboardFocusScroll();
  const digits = value.replace(/\D/g, '').slice(0, length);
  const digitFont = getFontFamily('en', 'regular');

  const setDigit = (index: number, digit: string) => {
    const chars = Array.from({ length }, (_, i) => digits[i] ?? '');
    chars[index] = digit;
    const next = chars.join('').replace(/\s/g, '');
    onChange(next);
    if (next.length === length) {
      onFilled?.(next);
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, index) => {
        const char = digits[index] ?? '';
        const isFocused = focusedIndex === index;

        return (
          <View
            key={index}
            style={[
              styles.cell,
              char ? styles.cellFilled : null,
              isFocused ? styles.cellFocused : null,
            ]}
          >
            <Text
              pointerEvents="none"
              style={[styles.overlayDigit, { fontFamily: digitFont }]}
            >
              {char ? (secureTextEntry ? '•' : char) : ''}
            </Text>
            <TextInput
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              value=""
              onChangeText={(text) => {
                const cleaned = text.replace(/\D/g, '');
                if (cleaned.length > 1) {
                  const pasted = cleaned.slice(0, length);
                  onChange(pasted);
                  if (pasted.length === length) onFilled?.(pasted);
                  const focusAt = Math.min(pasted.length, length - 1);
                  inputRefs.current[focusAt]?.focus();
                  return;
                }
                if (cleaned) {
                  setDigit(index, cleaned);
                  if (index < length - 1) {
                    inputRefs.current[index + 1]?.focus();
                  }
                }
              }}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') {
                  if (char) {
                    setDigit(index, '');
                  } else if (index > 0) {
                    setDigit(index - 1, '');
                    inputRefs.current[index - 1]?.focus();
                  }
                }
              }}
              onFocus={(event) => {
                setFocusedIndex(index);
                handleKeyboardFocus(event);
              }}
              onBlur={() => setFocusedIndex((current) => (current === index ? null : current))}
              keyboardType="number-pad"
              maxLength={length}
              autoFocus={autoFocus && index === 0}
              style={styles.input}
              caretHidden
              selectTextOnFocus={false}
            />
          </View>
        );
      })}
    </View>
  );
}

const CELL_HEIGHT = 52;

const styles = StyleSheet.create({
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
    position: 'absolute',
    fontSize: 22,
    lineHeight: CELL_HEIGHT,
    color: colors.text.primary,
    textAlign: 'center',
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: 'center' },
      default: {},
    }),
  },
  input: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    color: 'transparent',
  },
});
