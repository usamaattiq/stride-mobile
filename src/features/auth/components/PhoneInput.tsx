import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppText } from '@/shared/components/AppText';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { colors, radius, spacing } from '@/theme';
import { getFontFamily } from '@/theme/typography';

import {
  COUNTRY_OPTIONS,
  type CountryOption,
} from '../constants/countries';

export type PhoneInputProps = {
  value: string;
  onChangeDigits: (digits: string) => void;
  country: CountryOption;
  onSelectCountry: (country: CountryOption) => void;
  placeholder?: string;
};

export function PhoneInput({
  value,
  onChangeDigits,
  country,
  onSelectCountry,
  placeholder = '300 1234567',
}: PhoneInputProps): React.ReactElement {
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const displayValue = (() => {
    if (!value) return '';
    const a = value.slice(0, 3);
    const b = value.slice(3, 10);
    return b.length > 0 ? `${a} ${b}` : a;
  })();

  const closePicker = () => {
    setPickerVisible(false);
    setQuery('');
  };

  const filteredCountries = (() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '');
    if (!q) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.callingCode.includes(q) ||
        item.code.toLowerCase().includes(q),
    );
  })();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setPickerVisible(true)}
        style={styles.countryTap}
        accessibilityRole="button"
        accessibilityLabel={`Country ${country.code}`}
      >
        <AppText style={styles.flag}>{country.flag}</AppText>
        <AppText weight="semibold" style={styles.dialCode}>
          +{country.callingCode}
        </AppText>
        <FontAwesome name="chevron-down" size={10} color={colors.text.secondary} />
      </Pressable>

      <View style={styles.divider} />

      <TextInput
        value={displayValue}
        onChangeText={(text) => onChangeDigits(text.replace(/\D/g, '').slice(0, 10))}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        keyboardType="phone-pad"
        style={[styles.input, { fontFamily: getFontFamily(currentLanguage, 'regular') }]}
      />

      <AppBottomSheet
        visible={pickerVisible}
        onClose={closePicker}
        heightRatio={0.55}
      >
        <View style={styles.sheetHandle} />
        <AppText weight="semibold" style={styles.sheetTitle}>
        Select Country Code
        </AppText>

        <View style={styles.searchWrap}>
          <FontAwesome name="search" size={14} color={colors.text.tertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={'Select Country or Dial Code'}
            placeholderTextColor={colors.text.tertiary}
            autoCorrect={false}
            autoCapitalize="none"
            style={[styles.searchInput, { fontFamily: getFontFamily(currentLanguage, 'regular') }]}
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <FontAwesome name="times-circle" size={16} color={colors.text.tertiary} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((item) => (
              <Pressable
                key={item.code}
                style={[
                  styles.countryRow,
                  item.code === country.code && styles.countryRowSelected,
                ]}
                onPress={() => {
                  onSelectCountry(item);
                  closePicker();
                }}
              >
                <AppText style={styles.rowFlag}>{item.flag}</AppText>
                <AppText weight="semibold" style={styles.rowDial}>
                  +{item.callingCode}
                </AppText>
                <AppText style={styles.rowName} numberOfLines={1}>
                  {item.name}
                </AppText>
              </Pressable>
            ))
          ) : (
            <AppText style={styles.noResults}>{t('auth.countryPicker.noResults')}</AppText>
          )}
        </ScrollView>
      </AppBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  countryTap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingRight: spacing.xs,
  },
  flag: {
    fontSize: 20,
  },
  dialCode: {
    fontSize: 15,
    color: colors.text.primary,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.border.strong,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: spacing.xs,
  },
  noResults: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  countryRow: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  countryRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  rowFlag: {
    fontSize: 20,
  },
  rowDial: {
    fontSize: 14,
    color: colors.primary,
    minWidth: 48,
  },
  rowName: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
});
