import React from 'react';
import {
  ActivityIndicator,
  Pressable,
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
import { colors, getFontFamily, radius, spacing } from '@/theme';

type CitySearchFieldProps = {
  label: string;
  value: TripCity | null;
  onChange: (city: TripCity) => void;
  placeholder: string;
  required?: boolean;
};

export function CitySearchField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: CitySearchFieldProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const [query, setQuery] = React.useState(value?.label ?? '');
  const [results, setResults] = React.useState<TripCity[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showEmpty, setShowEmpty] = React.useState(false);
  const skipSearchRef = React.useRef(false);

  React.useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
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
  }, [query]);

  const handleSelect = (city: TripCity) => {
    skipSearchRef.current = true;
    setQuery(city.label);
    setResults([]);
    setShowEmpty(false);
    onChange(city);
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
  },
  resultRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
