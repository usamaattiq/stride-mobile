import React from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useLanguage } from '@/i18n/hooks/useLanguage';
import { colors, radius, spacing } from '@/theme';
import { getFontFamily } from '@/theme/typography';

type DashboardSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  style?: StyleProp<ViewStyle>;
};

export function DashboardSearchBar({
  value,
  onChangeText,
  placeholder,
  style,
}: DashboardSearchBarProps): React.ReactElement {
  const { currentLanguage } = useLanguage();

  return (
    <View style={[styles.root, style]}>
      <FontAwesome name="search" size={14} color={colors.text.tertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        style={[styles.input, { fontFamily: getFontFamily(currentLanguage, 'regular') }]}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        accessibilityLabel={placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.subtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: colors.text.primary,
    padding: 0,
    margin: 0,
  },
});
