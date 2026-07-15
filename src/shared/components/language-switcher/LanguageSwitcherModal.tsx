import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import type {
  LanguageOption,
  LanguageSwitcherModalProps,
} from './types/language-switcher.types';

const LanguageOptionRow = ({
  option,
  selected,
  onPress,
}: {
  option: LanguageOption;
  selected: boolean;
  onPress: () => void;
}): React.ReactElement => {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.optionRow, selected && styles.optionRowSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <AppText style={styles.optionFlag}>{option.flag}</AppText>
      <AppText weight="medium" style={styles.optionLabel}>
        {option.label}
      </AppText>
      {selected ? (
        <AppText weight="bold" style={styles.check}>
          ✓
        </AppText>
      ) : null}
    </Pressable>
  );
};

export function LanguageSwitcherModal({
  visible,
  currentLanguage,
  onClose,
  onSelectLanguage,
  options,
}: LanguageSwitcherModalProps): React.ReactElement {
  const { width } = useWindowDimensions();
  const modalWidth = Math.min(360, Math.max(280, width - spacing.xl * 2));
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop} testID="language-switcher-modal">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalCard, { width: modalWidth }]}>
          <AppText weight="semibold" style={styles.title}>
            {t('language.selectLanguage')}
          </AppText>
          <View style={styles.optionsWrap}>
            {options.map((option) => (
              <LanguageOptionRow
                key={option.code}
                option={option}
                selected={option.code === currentLanguage}
                onPress={() => onSelectLanguage(option.code)}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.background.canvas,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  title: {
    fontSize: 16,
    color: colors.text.primary,
  },
  optionsWrap: {
    gap: spacing.sm,
  },
  optionRow: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  optionFlag: {
    fontSize: 16,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  check: {
    color: colors.primary,
    fontSize: 14,
  },
});
