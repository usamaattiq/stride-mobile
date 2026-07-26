import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  applyLocalDateToIso,
  daysInMonth,
  formatDateRangeLabel,
  isSameLocalDay,
  mondayFirstWeekday,
  parseIsoDate,
  startOfLocalDay,
} from '@/features/dashboard/components/trip/dateRangeUtils';
import { i18n as appI18n } from '@/i18n';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

type DateRangeCalendarFieldProps = {
  label: string;
  startIso: string | null;
  endIso: string | null;
  onChange: (next: { startIso: string | null; endIso: string | null }) => void;
  required?: boolean;
  /** Skip the built-in label — use when a shared heading covers this field. */
  hideLabel?: boolean;
};

function formatDay(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
}

function formatMonthTitle(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
}

export function DateRangeCalendarField({
  label,
  startIso,
  endIso,
  onChange,
  required = false,
  hideLabel = false,
}: DateRangeCalendarFieldProps): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const locale = i18n.language;

  const startDate = parseIsoDate(startIso);
  const endDate = parseIsoDate(endIso);

  const [open, setOpen] = React.useState(false);
  const [visibleMonth, setVisibleMonth] = React.useState(() =>
    startOfLocalDay(startDate ?? new Date()),
  );
  const [draftStart, setDraftStart] = React.useState<Date | null>(
    startDate ? startOfLocalDay(startDate) : null,
  );
  const [draftEnd, setDraftEnd] = React.useState<Date | null>(
    endDate ? startOfLocalDay(endDate) : null,
  );

  const openSheet = () => {
    setDraftStart(startDate ? startOfLocalDay(startDate) : null);
    setDraftEnd(endDate ? startOfLocalDay(endDate) : null);
    setVisibleMonth(startOfLocalDay(startDate ?? new Date()));
    setOpen(true);
  };

  const shiftMonth = (delta: number) => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  };

  const onDayPress = (day: Date) => {
    const selected = startOfLocalDay(day);

    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(selected);
      setDraftEnd(null);
      return;
    }

    if (selected.getTime() < draftStart.getTime()) {
      setDraftStart(selected);
      setDraftEnd(null);
      return;
    }

    setDraftEnd(selected);
  };

  const applyRange = () => {
    if (!draftStart) {
      onChange({ startIso: null, endIso: null });
      setOpen(false);
      return;
    }

    onChange({
      startIso: applyLocalDateToIso(startIso, draftStart, 9),
      endIso: draftEnd ? applyLocalDateToIso(endIso, draftEnd, 18) : null,
    });
    setOpen(false);
  };

  const clearRange = () => {
    setDraftStart(null);
    setDraftEnd(null);
    onChange({ startIso: null, endIso: null });
    setOpen(false);
  };

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = mondayFirstWeekday(new Date(year, month, 1));
  const totalDays = daysInMonth(year, month);
  const today = startOfLocalDay(new Date());

  const cells: Array<Date | null> = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const rangeLabel = formatDateRangeLabel(
    startIso,
    endIso,
    locale,
    t('trips.create.selectDateRange'),
  );

  const weekdayLabels = React.useMemo(() => {
    const monday = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + index);
      return day.toLocaleDateString(locale, { weekday: 'narrow' });
    });
  }, [locale]);

  return (
    <View style={styles.wrap}>
      {!hideLabel ? (
        <>
          <AppText weight="medium" style={styles.label}>
            {label}
            {required ? <AppText style={styles.required}> *</AppText> : null}
          </AppText>
          <AppText style={styles.hint}>{t('trips.create.departureWindowHint')}</AppText>
        </>
      ) : null}

      <Pressable
        onPress={openSheet}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <FontAwesome name="calendar" size={14} color={colors.primary} />
        <AppText
          weight="semibold"
          style={[styles.triggerValue, !startDate && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {startDate && !endDate
            ? `${formatDay(startDate, locale)} → ${t('trips.create.selectDate')}`
            : rangeLabel}
        </AppText>
        <FontAwesome name="angle-right" size={16} color={colors.text.tertiary} />
      </Pressable>

      <AppBottomSheet visible={open} onClose={() => setOpen(false)} heightRatio={0.72}>
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <AppText weight="bold" style={styles.sheetTitle}>
              {t('trips.create.departureDateWindow')}
            </AppText>
            <View style={styles.sheetSubtitleWrap}>
              <AppText style={styles.sheetSubtitle} numberOfLines={2}>
                {draftStart && draftEnd
                  ? `${formatDay(draftStart, locale)} → ${formatDay(draftEnd, locale)}`
                  : draftStart
                    ? `${formatDay(draftStart, locale)} → ${t('trips.create.selectDate')}`
                    : t('trips.create.departureWindowHint')}
              </AppText>
            </View>
          </View>

          <View style={styles.monthRow}>
            <Pressable
              onPress={() => shiftMonth(-1)}
              style={styles.monthNav}
              hitSlop={8}
              accessibilityRole="button"
            >
              <FontAwesome name="angle-left" size={18} color={colors.text.primary} />
            </Pressable>
            <AppText weight="semibold" style={styles.monthTitle}>
              {formatMonthTitle(visibleMonth, locale)}
            </AppText>
            <Pressable
              onPress={() => shiftMonth(1)}
              style={styles.monthNav}
              hitSlop={8}
              accessibilityRole="button"
            >
              <FontAwesome name="angle-right" size={18} color={colors.text.primary} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {weekdayLabels.map((weekday, index) => (
              <AppText key={`${weekday}-${index}`} style={styles.weekday}>
                {weekday}
              </AppText>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, index) => {
              if (!day) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const inRange =
                draftStart != null &&
                draftEnd != null &&
                day.getTime() >= draftStart.getTime() &&
                day.getTime() <= draftEnd.getTime();
              const isStart = draftStart != null && isSameLocalDay(day, draftStart);
              const isEnd = draftEnd != null && isSameLocalDay(day, draftEnd);
              const isEdge = isStart || isEnd;
              const isToday = isSameLocalDay(day, today);
              const isPast = day.getTime() < today.getTime();

              return (
                <Pressable
                  key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                  disabled={isPast}
                  onPress={() => onDayPress(day)}
                  style={styles.dayCell}
                >
                  <View
                    style={[
                      styles.dayInner,
                      inRange && !isEdge && styles.dayInRange,
                      isEdge && styles.dayEdge,
                      isPast && styles.dayPast,
                    ]}
                  >
                    <AppText
                      weight="medium"
                      style={[
                        styles.dayLabel,
                        isEdge && styles.dayLabelEdge,
                        isPast && styles.dayLabelPast,
                        isToday && !isEdge && styles.dayLabelToday,
                      ]}
                    >
                      {day.getDate()}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Button
              label={t('common.clear')}
              onPress={clearRange}
              variant="secondary"
              style={styles.actionButton}
            />
            <Button
              label={t('common.done')}
              onPress={applyRange}
              disabled={!draftStart || !draftEnd}
              style={styles.actionButton}
            />
          </View>
        </View>
      </AppBottomSheet>
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
  hint: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  trigger: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  triggerPressed: {
    opacity: 0.88,
  },
  triggerValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  triggerPlaceholder: {
    color: colors.text.tertiary,
  },
  sheetContent: {
    flex: 1,
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  sheetHeader: {
    gap: 2,
  },
  sheetTitle: {
    fontSize: 17,
    color: colors.text.primary,
  },
  sheetSubtitleWrap: {
    minHeight: 36,
    justifyContent: 'center',
  },
  sheetSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  monthNav: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  weekRow: {
    flexDirection: 'row',
    height: 22,
    alignItems: 'center',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: colors.text.tertiary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInRange: {
    backgroundColor: colors.primarySoft,
    borderRadius: 0,
    width: '100%',
  },
  dayEdge: {
    backgroundColor: colors.primary,
  },
  dayPast: {
    opacity: 0.35,
  },
  dayLabel: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.text.primary,
    textAlign: 'center',
  },
  dayLabelEdge: {
    color: colors.white,
  },
  dayLabelPast: {
    color: colors.text.tertiary,
  },
  dayLabelToday: {
    color: colors.primary,
  },
  actions: {
    marginTop: 'auto',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
