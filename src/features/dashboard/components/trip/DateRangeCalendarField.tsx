import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  applyLocalDateToIso,
  clampDateWindowEnd,
  daysInMonth,
  formatDateRangeLabel,
  isSameLocalDay,
  MAX_DATE_WINDOW_DAYS,
  mondayFirstWeekday,
  parseIsoDate,
  startOfLocalDay,
} from '@/features/dashboard/components/trip/dateRangeUtils';
import { i18n as appI18n } from '@/i18n';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { withLatinDigitsLocale } from '@/shared/utils/latin-digits';
import { colors, radius, spacing } from '@/theme';

type DateRangeCalendarFieldProps = {
  label: string;
  startIso: string | null;
  endIso: string | null;
  onChange: (next: { startIso: string | null; endIso: string | null }) => void;
  required?: boolean;
  /** Skip the built-in label — use when a shared heading covers this field. */
  hideLabel?: boolean;
  /** `onBrand` is for the red passenger search card (white text, no chrome). */
  variant?: 'default' | 'onBrand';
  /**
   * Render only the calendar (no trigger / nested sheet). Use inside a parent
   * bottom sheet such as trip-create departure.
   */
  embedded?: boolean;
  /** Called after the user confirms a range in embedded mode. */
  onApply?: () => void;
  /** Rendered above Clear / Done when the current draft is a single day. */
  footer?: React.ReactNode;
  /** Fired as soon as the in-progress selection becomes a multi-day window. */
  onWindowSelected?: () => void;
};

function formatDay(date: Date, locale: string): string {
  return date.toLocaleDateString(withLatinDigitsLocale(locale), {
    day: 'numeric',
    month: 'short',
  });
}

function formatMonthTitle(date: Date, locale: string): string {
  return date.toLocaleDateString(withLatinDigitsLocale(locale), {
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
  variant = 'default',
  embedded = false,
  onApply,
  footer,
  onWindowSelected,
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

  const commitDays = (start: Date | null, end: Date | null) => {
    if (!start) {
      onChange({ startIso: null, endIso: null });
      return;
    }

    const endDay = clampDateWindowEnd(start, end ?? start);
    const window = !isSameLocalDay(start, endDay);
    if (window) {
      onWindowSelected?.();
    }
    onChange({
      startIso: applyLocalDateToIso(window ? null : startIso, start, 9),
      endIso: applyLocalDateToIso(window ? null : endIso, endDay, 18),
    });
  };

  const onDayPress = (day: Date) => {
    const selected = startOfLocalDay(day);

    let nextStart: Date | null;
    let nextEnd: Date | null;

    const completeWindow =
      draftStart != null &&
      draftEnd != null &&
      !isSameLocalDay(draftStart, draftEnd);

    if (!draftStart || completeWindow) {
      nextStart = selected;
      nextEnd = embedded ? selected : null;
    } else if (selected.getTime() < draftStart.getTime()) {
      nextStart = selected;
      nextEnd = embedded ? selected : null;
    } else {
      nextStart = draftStart;
      nextEnd = clampDateWindowEnd(draftStart, selected);
      if (!isSameLocalDay(draftStart, nextEnd)) {
        onWindowSelected?.();
      }
    }

    setDraftStart(nextStart);
    setDraftEnd(nextEnd);
    if (embedded) {
      commitDays(nextStart, nextEnd);
    }
  };

  const applyRange = () => {
    commitDays(draftStart, draftEnd);
    setOpen(false);
    onApply?.();
  };

  const clearRange = () => {
    setDraftStart(null);
    setDraftEnd(null);
    onChange({ startIso: null, endIso: null });
    setOpen(false);
    onApply?.();
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
  const weeks: Array<Array<Date | null>> = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
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
      return day.toLocaleDateString(withLatinDigitsLocale(locale), { weekday: 'narrow' });
    });
  }, [locale]);

  const onBrand = variant === 'onBrand';
  const isMultiDayDraft =
    draftStart != null && draftEnd != null && !isSameLocalDay(draftStart, draftEnd);

  const calendarBody = (
    <View style={[styles.sheetContent, embedded && styles.sheetContentEmbedded]}>
      {embedded ? null : (
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
                  : t('trips.create.departureWindowHint', { count: MAX_DATE_WINDOW_DAYS })}
            </AppText>
          </View>
        </View>
      )}

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
        {weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekDaysRow}>
            {week.map((day, index) => {
              if (!day) {
                return <View key={`empty-${weekIndex}-${index}`} style={styles.dayCell} />;
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
        ))}
      </View>

      {footer && !isMultiDayDraft ? <View style={styles.footer}>{footer}</View> : null}

      <AppText style={styles.maxDaysNote}>
        {t('trips.create.departureWindowMaxDays', { count: MAX_DATE_WINDOW_DAYS })}
      </AppText>

      {embedded ? null : (
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
            disabled={!draftStart}
            style={styles.actionButton}
          />
        </View>
      )}
    </View>
  );

  if (embedded) {
    return calendarBody;
  }

  return (
    <View style={[styles.wrap, onBrand && styles.wrapOnBrand]}>
      {!hideLabel ? (
        <>
          <AppText weight="medium" style={styles.label}>
            {label}
            {required ? <AppText style={styles.required}> *</AppText> : null}
          </AppText>
          <AppText style={styles.hint}>
            {t('trips.create.departureWindowHint', { count: MAX_DATE_WINDOW_DAYS })}
          </AppText>
        </>
      ) : null}

      <Pressable
        onPress={openSheet}
        style={({ pressed }) => [
          styles.trigger,
          onBrand && styles.triggerOnBrand,
          pressed && styles.triggerPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <FontAwesome name="calendar" size={onBrand ? 13 : 14} color={onBrand ? colors.white : colors.primary} />
        <AppText
          weight="semibold"
          style={[
            styles.triggerValue,
            onBrand && styles.triggerValueOnBrand,
            !startDate && (onBrand ? styles.triggerPlaceholderOnBrand : styles.triggerPlaceholder),
          ]}
          numberOfLines={1}
        >
          {startDate && !endDate
            ? `${formatDay(startDate, locale)} → ${t('trips.create.selectDate')}`
            : rangeLabel}
        </AppText>
        {onBrand ? null : (
          <FontAwesome name="angle-right" size={16} color={colors.text.tertiary} />
        )}
      </Pressable>

      <AppBottomSheet visible={open} onClose={() => setOpen(false)} heightRatio={0.77}>
        {calendarBody}
      </AppBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  wrapOnBrand: {
    flex: 1,
    gap: 0,
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
  triggerOnBrand: {
    minHeight: 44,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  triggerValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  triggerValueOnBrand: {
    color: colors.white,
  },
  triggerPlaceholder: {
    color: colors.text.tertiary,
  },
  triggerPlaceholderOnBrand: {
    color: colors.text.onBrandMuted,
  },
  sheetContent: {
    flex: 1,
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  sheetContentEmbedded: {
    flex: 0,
  },
  footer: {
    gap: spacing.sm,
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
    gap: 0,
  },
  weekDaysRow: {
    flexDirection: 'row',
    width: '100%',
  },
  dayCell: {
    flex: 1,
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
  maxDaysNote: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
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
