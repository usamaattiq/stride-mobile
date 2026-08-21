import React from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { withLatinDigitsLocale } from '@/shared/utils/latin-digits';
import { colors, radius, spacing } from '@/theme';

const IOS_PICKER_HEIGHT = 216;
const IOS_SHEET_PADDING = spacing.sm * 2;
const iosPickerWidth = Dimensions.get('window').width - IOS_SHEET_PADDING;

type DateTimePickerFieldProps = {
  label: string;
  value: string | null;
  onChange: (isoValue: string, part: 'date' | 'time') => void;
  onClear?: () => void;
  minimumDate?: Date;
  required?: boolean;
  optional?: boolean;
  /** 'time' hides the date part — use when the date is already picked elsewhere. 'date' hides the time part. */
  mode?: 'date-time' | 'time' | 'date';
  /** Skip the built-in label — use when a shared heading covers this field. */
  hideLabel?: boolean;
  /** `search` matches passenger-home fields on a white surface. */
  variant?: 'default' | 'search';
  /**
   * Whether the time part reflects an explicit user choice — otherwise shows the time
   * placeholder even if `value` already carries a baked-in default time. Defaults to
   * whether `value` is set, for fields with no separate default-filling step.
   */
  timeConfirmed?: boolean;
  /** iOS: expand the spinner under this field instead of a bottom sheet. */
  inline?: boolean;
};

function parseIso(value: string | null): Date {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(withLatinDigitsLocale(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(withLatinDigitsLocale(locale), {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function DateTimePickerField({
  label,
  value,
  onChange,
  onClear,
  minimumDate,
  required = false,
  optional = false,
  mode = 'date-time',
  hideLabel = false,
  variant = 'default',
  timeConfirmed,
  inline = false,
}: DateTimePickerFieldProps): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const insets = useSafeAreaInsets();
  const locale = i18n.language;
  const hasValue = Boolean(value);
  const hasTimeValue = timeConfirmed ?? hasValue;
  const current = parseIso(value);
  const [pickerMode, setPickerMode] = React.useState<'date' | 'time' | null>(null);
  const [draft, setDraft] = React.useState(current);

  const openPicker = (nextMode: 'date' | 'time') => {
    setDraft(current);
    setPickerMode(nextMode);
  };

  const commit = (next: Date, part: 'date' | 'time') => {
    onChange(next.toISOString(), part);
  };

  const applySelection = (selected: Date, part: 'date' | 'time') => {
    if (part === 'date') {
      const base = hasValue ? current : new Date();
      const merged = new Date(base);
      merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      commit(merged, 'date');
      return;
    }

    const base = hasValue ? current : new Date();
    const merged = new Date(base);
    merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    commit(merged, 'time');
  };

  const handleAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    const part = pickerMode;
    setPickerMode(null);
    if (event.type === 'dismissed' || !selected || !part) {
      return;
    }
    applySelection(selected, part);
  };

  const handleIosChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) {
      setDraft(selected);
    }
  };

  const handleIosDone = () => {
    const part = pickerMode;
    setPickerMode(null);
    if (!part) {
      return;
    }
    applySelection(draft, part);
  };

  const handleIosCancel = () => {
    setPickerMode(null);
  };

  return (
    <View style={styles.wrap}>
      {!hideLabel ? (
        <AppText weight="medium" style={styles.label}>
          {label}
          {required ? <AppText style={styles.required}> *</AppText> : null}
          {optional ? <AppText style={styles.optional}> (optional)</AppText> : null}
        </AppText>
      ) : null}

      <View style={styles.row}>
        {mode !== 'time' ? (
          <Pressable
            onPress={() => openPicker('date')}
            style={[
              styles.part,
              mode === 'date-time' ? styles.partDate : styles.partFull,
              variant === 'search' && styles.partSearch,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('trips.create.selectDate')}
          >
            {variant === 'search' ? (
              <FontAwesome name="calendar" size={13} color={colors.text.secondary} />
            ) : null}
            <AppText weight="semibold" style={[styles.partValue, !hasValue && styles.partPlaceholder]}>
              {hasValue ? formatDate(current, locale) : t('trips.create.selectDate')}
            </AppText>
          </Pressable>
        ) : null}

        {mode !== 'date' ? (
          <Pressable
            onPress={() => openPicker('time')}
            style={[
              styles.part,
              mode === 'date-time' ? styles.partTime : styles.partFull,
              variant === 'search' && styles.partSearch,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('trips.create.selectTime')}
          >
            {variant === 'search' ? (
              <FontAwesome name="clock-o" size={13} color={colors.text.secondary} />
            ) : null}
            <AppText weight="semibold" style={[styles.partValue, !hasTimeValue && styles.partPlaceholder]}>
              {hasTimeValue ? formatTime(current, locale) : t('trips.create.selectTime')}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {onClear && hasValue ? (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.clear')}
        >
          <AppText style={styles.clearText}>{t('common.clear')}</AppText>
        </Pressable>
      ) : null}

      {pickerMode && Platform.OS === 'android' ? (
        <DateTimePicker
          value={current}
          mode={pickerMode}
          minimumDate={minimumDate}
          onChange={handleAndroidChange}
          display="default"
          design="default"
        />
      ) : null}

      {Platform.OS === 'ios' && pickerMode && inline ? (
        <View style={styles.inlinePicker}>
          <View style={styles.iosPickerWrap}>
            <DateTimePicker
              value={draft}
              mode={pickerMode}
              minimumDate={minimumDate}
              onChange={handleIosChange}
              display="spinner"
              themeVariant="light"
              textColor={colors.text.primary}
              style={styles.iosPicker}
            />
          </View>
          <View style={styles.inlineActions}>
            <Pressable
              accessibilityRole="button"
              onPress={handleIosCancel}
              style={styles.inlineAction}
            >
              <AppText weight="semibold" style={styles.inlineActionMuted}>
                {t('common.cancel')}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleIosDone}
              style={styles.inlineAction}
            >
              <AppText weight="semibold" style={styles.modalDoneText}>
                {t('common.done')}
              </AppText>
            </Pressable>
          </View>
        </View>
      ) : null}

      {Platform.OS === 'ios' && !inline ? (
        <Modal
          transparent
          animationType="fade"
          visible={pickerMode != null}
          onRequestClose={handleIosCancel}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleIosCancel}>
            <View
              style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
            >
              <View style={styles.modalCard}>
                {pickerMode ? (
                  <View style={styles.iosPickerWrap}>
                    <DateTimePicker
                      value={draft}
                      mode={pickerMode}
                      minimumDate={minimumDate}
                      onChange={handleIosChange}
                      display="spinner"
                      themeVariant="light"
                      textColor={colors.text.primary}
                      style={styles.iosPicker}
                    />
                  </View>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={handleIosDone}
                  style={styles.modalDone}
                >
                  <AppText weight="semibold" style={styles.modalDoneText}>
                    {t('common.done')}
                  </AppText>
                </Pressable>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={handleIosCancel}
                style={styles.modalCancel}
              >
                <AppText weight="semibold" style={styles.modalDoneText}>
                  {t('common.cancel')}
                </AppText>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    color: colors.text.primary,
  },
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  optional: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  part: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  partSearch: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  partFull: {
    flex: 1,
  },
  partDate: {
    flex: 6,
  },
  partTime: {
    flex: 4,
  },
  partValue: {
    fontSize: 14,
    color: colors.text.primary,
  },
  partPlaceholder: {
    color: colors.text.tertiary,
  },
  clearText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  inlinePicker: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  inlineActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  inlineAction: {
    paddingVertical: spacing.sm,
  },
  inlineActionMuted: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  modalCard: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  iosPickerWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosPicker: {
    width: iosPickerWidth,
    height: IOS_PICKER_HEIGHT,
  },
  modalDone: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  modalDoneText: {
    fontSize: 17,
    color: colors.primary,
  },
  modalCancel: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
});
