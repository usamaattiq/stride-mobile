import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import type { TripCity } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppText } from '@/shared/components/AppText';
import { ENV } from '@/shared/config/env';
import { searchCities } from '@/shared/utils/city-search';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { colors, getFontFamily, radius, spacing } from '@/theme';

const CITY_RESULT_ROW_HEIGHT = 48;
const CITY_RESULTS_VISIBLE_COUNT = 3;
export const CITY_RESULTS_MAX_HEIGHT = CITY_RESULT_ROW_HEIGHT * CITY_RESULTS_VISIBLE_COUNT;

type CitySearchFieldProps = {
  label: string;
  value: TripCity | null;
  onChange: (city: TripCity) => void;
  placeholder: string;
  required?: boolean;
  onFocus?: () => void;
};

export function CitySearchField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  onFocus,
}: CitySearchFieldProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const [query, setQuery] = React.useState(value?.label ?? '');
  const [results, setResults] = React.useState<TripCity[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showEmpty, setShowEmpty] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const skipSearchRef = React.useRef(false);

  React.useEffect(() => {
    if (isFocused) {
      return;
    }
    setQuery(value?.label ?? '');
  }, [isFocused, value?.label]);

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
      void searchCities(trimmed, ENV.googleMapsApiKey)
        .then((items) => {
          setResults(items);
          setShowEmpty(items.length === 0);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [isFocused, query]);

  const handleSelect = (city: TripCity) => {
    const selected = { ...city, label: cityDisplayName(city.label) };
    skipSearchRef.current = true;
    setQuery(selected.label);
    setResults([]);
    setShowEmpty(false);
    setIsFocused(false);
    onChange(selected);
  };

  return (
    <View style={styles.wrap}>
      <AppText weight="medium" style={styles.label}>
        {label}
        {required ? <AppText style={styles.required}> *</AppText> : null}
      </AppText>

      <View style={styles.inputWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            setResults([]);
            setShowEmpty(false);
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          style={[styles.input, { fontFamily: getFontFamily(currentLanguage, 'regular') }]}
        />
        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      {!ENV.googleMapsApiKey ? (
        <AppText style={styles.hint}>{t('trips.create.cityApiHint')}</AppText>
      ) : null}

      {results.length > 0 ? (
        <View style={styles.results}>
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={results.length > CITY_RESULTS_VISIBLE_COUNT}
            style={styles.resultsScroll}
          >
            {results.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleSelect(item)}
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

      {!loading && showEmpty ? (
        <AppText style={styles.hint}>{t('trips.create.cityNoResults')}</AppText>
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
    maxHeight: CITY_RESULTS_MAX_HEIGHT,
    zIndex: 20,
    elevation: 6,
  },
  resultsScroll: {
    maxHeight: CITY_RESULTS_MAX_HEIGHT,
  },
  resultRow: {
    minHeight: CITY_RESULT_ROW_HEIGHT,
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
});
