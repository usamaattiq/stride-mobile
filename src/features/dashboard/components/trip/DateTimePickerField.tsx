import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

type DateTimePickerFieldProps = {
  label: string;
  value: string | null;
  onChange: (isoValue: string, part: 'date' | 'time') => void;
  minimumDate?: Date;
  required?: boolean;
  optional?: boolean;
  /** 'time' hides the date part — use when the date is already picked elsewhere. */
  mode?: 'date-time' | 'time';
  /** Skip the built-in label — use when a shared heading covers this field. */
  hideLabel?: boolean;
  /**
   * Whether the time part reflects an explicit user choice — otherwise shows the time
   * placeholder even if `value` already carries a baked-in default time. Defaults to
   * whether `value` is set, for fields with no separate default-filling step.
   */
  timeConfirmed?: boolean;
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
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function DateTimePickerField({
  label,
  value,
  onChange,
  minimumDate,
  required = false,
  optional = false,
  mode = 'date-time',
  hideLabel = false,
  timeConfirmed,
}: DateTimePickerFieldProps): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const locale = i18n.language;
  const hasValue = Boolean(value);
  const hasTimeValue = timeConfirmed ?? hasValue;
  const current = parseIso(value);
  const [pickerMode, setPickerMode] = React.useState<'date' | 'time' | null>(null);

  const commit = (next: Date, part: 'date' | 'time') => {
    onChange(next.toISOString(), part);
  };

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setPickerMode(null);
    }

    if (event.type === 'dismissed' || !selected) {
      return;
    }

    if (pickerMode === 'date') {
      const base = hasValue ? current : new Date();
      const merged = new Date(base);
      merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      commit(merged, 'date');
      return;
    }

    if (pickerMode === 'time') {
      const base = hasValue ? current : new Date();
      const merged = new Date(base);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      commit(merged, 'time');
    }
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
        {mode === 'date-time' ? (
          <Pressable
            onPress={() => setPickerMode('date')}
            style={[styles.part, styles.partDate]}
            accessibilityRole="button"
            accessibilityLabel={t('trips.create.selectDate')}
          >
            <AppText weight="semibold" style={[styles.partValue, !hasValue && styles.partPlaceholder]}>
              {hasValue ? formatDate(current, locale) : t('trips.create.selectDate')}
            </AppText>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => setPickerMode('time')}
          style={[styles.part, mode === 'date-time' ? styles.partTime : styles.partFull]}
          accessibilityRole="button"
          accessibilityLabel={t('trips.create.selectTime')}
        >
          <AppText weight="semibold" style={[styles.partValue, !hasTimeValue && styles.partPlaceholder]}>
            {hasTimeValue ? formatTime(current, locale) : t('trips.create.selectTime')}
          </AppText>
        </Pressable>
      </View>

      {pickerMode ? (
        <DateTimePicker
          value={current}
          mode={pickerMode}
          minimumDate={minimumDate}
          onChange={handleChange}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        />
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
});
