import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import type { TripCity } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppText } from '@/shared/components/AppText';
import { tripApi } from '@/services/api/tripApi';
import type { TerminalKind, TerminalSearchItemDto } from '@/services/api/tripApi.types';
import { colors, getFontFamily, radius, spacing } from '@/theme';

const RESULT_ROW_HEIGHT = 48;
const RESULTS_VISIBLE_COUNT = 4;
export const TERMINAL_RESULTS_MAX_HEIGHT = RESULT_ROW_HEIGHT * RESULTS_VISIBLE_COUNT;

type TerminalSearchFieldProps = {
  kind: TerminalKind;
  label: string;
  value: TripCity | null;
  onChange: (item: TerminalSearchItemDto | null) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
  excludeId?: string | null;
};

export function TerminalSearchField({
  kind,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  excludeId,
}: TerminalSearchFieldProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const [query, setQuery] = React.useState(value?.label ?? '');
  const [results, setResults] = React.useState<TerminalSearchItemDto[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showEmpty, setShowEmpty] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const skipSearchRef = React.useRef(false);
  const inputRef = React.useRef<TextInput>(null);
  const iconName = kind === 'airport' ? 'plane' : 'anchor';

  React.useEffect(() => {
    if (isFocused) {
      return;
    }
    setQuery(value?.label ?? '');
  }, [isFocused, value?.label]);

  React.useEffect(() => {
    if (!isFocused) {
      return;
    }
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isFocused]);

  React.useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    if (!isFocused) {
      setResults([]);
      setShowEmpty(false);
      setLoading(false);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setShowEmpty(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      setShowEmpty(false);
      void tripApi
        .searchTerminals(kind, trimmed, currentLanguage)
        .then((items) => {
          const filtered = excludeId ? items.filter((item) => item.id !== excludeId) : items;
          setResults(filtered);
          setShowEmpty(filtered.length === 0);
        })
        .catch(() => {
          setResults([]);
          setShowEmpty(true);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [currentLanguage, excludeId, isFocused, kind, query]);

  const handleSelect = (item: TerminalSearchItemDto) => {
    skipSearchRef.current = true;
    setResults([]);
    setShowEmpty(false);
    setIsFocused(false);
    setQuery(item.label);
    onChange(item);
  };

  const handleEdit = () => {
    skipSearchRef.current = false;
    setQuery('');
    setIsFocused(true);
  };

  const handleClear = () => {
    skipSearchRef.current = false;
    setQuery('');
    setResults([]);
    setShowEmpty(false);
    onChange(null);
  };

  return (
    <View style={styles.wrap}>
      <AppText weight="medium" style={styles.label}>
        {label}
        {required ? <AppText style={styles.required}> *</AppText> : null}
      </AppText>

      {value && !isFocused ? (
        <Pressable
          onPress={handleEdit}
          style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          accessibilityRole="button"
        >
          <FontAwesome name={iconName} size={14} color={colors.primary} />
          <AppText style={styles.chipText} numberOfLines={1}>
            {value.label}
          </AppText>
          <Pressable
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
          >
            <FontAwesome name="times-circle" size={16} color={colors.text.tertiary} />
          </Pressable>
        </Pressable>
      ) : (
        <View style={[styles.inputWrap, error ? styles.inputError : null]}>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setTimeout(() => {
                setIsFocused(false);
              }, 180);
            }}
            placeholder={placeholder}
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="words"
            style={[styles.input, { fontFamily: getFontFamily(currentLanguage, 'regular') }]}
          />
          {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>
      )}

      {results.length > 0 ? (
        <View style={styles.results}>
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={results.length > RESULTS_VISIBLE_COUNT}
            style={styles.resultsScroll}
          >
            {results.map((item) => (
              <Pressable
                key={item.id}
                onPressIn={() => handleSelect(item)}
                style={styles.resultRow}
                accessibilityRole="button"
              >
                <AppText style={styles.resultText} numberOfLines={2}>
                  {item.label}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {error ? <AppText style={styles.error}>{error}</AppText> : null}

      {!loading && showEmpty && !error ? (
        <AppText style={styles.hint}>
          {kind === 'airport'
            ? t('trips.create.airportNoResults')
            : t('trips.create.portNoResults')}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xxs,
  },
  label: {
    fontSize: 13,
    color: colors.text.primary,
  },
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  inputWrap: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputError: {
    borderColor: colors.primary,
  },
  chip: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    minHeight: 38,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primaryDisabled,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chipPressed: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipText: {
    flexShrink: 1,
    fontSize: 14,
    color: colors.primary,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: spacing.xs,
  },
  results: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    overflow: 'hidden',
    maxHeight: TERMINAL_RESULTS_MAX_HEIGHT,
    zIndex: 20,
    elevation: 6,
  },
  resultsScroll: {
    maxHeight: TERMINAL_RESULTS_MAX_HEIGHT,
  },
  resultRow: {
    minHeight: RESULT_ROW_HEIGHT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  resultText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  hint: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
  },
});
