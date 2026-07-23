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
  onChange: (isoValue: string) => void;
  minimumDate?: Date;
  required?: boolean;
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
}: DateTimePickerFieldProps): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const locale = i18n.language;
  const hasValue = Boolean(value);
  const current = parseIso(value);
  const [pickerMode, setPickerMode] = React.useState<'date' | 'time' | null>(null);

  const commit = (next: Date) => {
    onChange(next.toISOString());
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
      commit(merged);
      if (Platform.OS === 'android') {
        setPickerMode('time');
      }
      return;
    }

    if (pickerMode === 'time') {
      const base = hasValue ? current : new Date();
      const merged = new Date(base);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      commit(merged);
    }
  };

  return (
    <View style={styles.wrap}>
      <AppText weight="medium" style={styles.label}>
        {label}
        {required ? <AppText style={styles.required}> *</AppText> : null}
      </AppText>

      <View style={styles.row}>
        <Pressable
          onPress={() => setPickerMode('date')}
          style={styles.part}
          accessibilityRole="button"
          accessibilityLabel={t('trips.create.pickDate')}
        >
          <AppText style={styles.partCaption}>{t('trips.create.date')}</AppText>
          <AppText weight="semibold" style={[styles.partValue, !hasValue && styles.partPlaceholder]}>
            {hasValue ? formatDate(current, locale) : t('trips.create.pickDate')}
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => setPickerMode('time')}
          style={styles.part}
          accessibilityRole="button"
          accessibilityLabel={t('trips.create.pickTime')}
        >
          <AppText style={styles.partCaption}>{t('trips.create.time')}</AppText>
          <AppText weight="semibold" style={[styles.partValue, !hasValue && styles.partPlaceholder]}>
            {hasValue ? formatTime(current, locale) : t('trips.create.pickTime')}
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  part: {
    flex: 1,
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  partCaption: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  partValue: {
    fontSize: 14,
    color: colors.text.primary,
  },
  partPlaceholder: {
    color: colors.text.tertiary,
  },
});
