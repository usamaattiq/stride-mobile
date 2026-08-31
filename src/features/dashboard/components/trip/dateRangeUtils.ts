/** Local calendar-day helpers (ignore time-of-day for range comparison). */

import { withLatinDigitsLocale } from '@/shared/utils/latin-digits';

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Inclusive local calendar days in a [start, end] window. Same day = 1. */
export const MAX_DATE_WINDOW_DAYS = 4;

export function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function inclusiveLocalDayCount(start: Date, end: Date): number {
  const startDay = startOfLocalDay(start).getTime();
  const endDay = startOfLocalDay(end).getTime();
  const diff = Math.round((endDay - startDay) / 86_400_000);
  return Math.abs(diff) + 1;
}

export function clampDateWindowEnd(start: Date, end: Date, maxDays = MAX_DATE_WINDOW_DAYS): Date {
  const startDay = startOfLocalDay(start);
  const endDay = startOfLocalDay(end);
  const latest = addLocalDays(startDay, maxDays - 1);
  return endDay.getTime() > latest.getTime() ? latest : endDay;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Inclusive local-day overlap of two [start, end] windows. */
export function localDateRangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  const a0 = startOfLocalDay(aStart).getTime();
  const a1 = startOfLocalDay(aEnd).getTime();
  const b0 = startOfLocalDay(bStart).getTime();
  const b1 = startOfLocalDay(bEnd).getTime();
  return a0 <= b1 && b0 <= a1;
}

/** Window used for search matching: open listings use the publish + durationHours life. */
export function getTripAvailabilityWindow(trip: {
  departureOpen: boolean;
  publishedAt: string;
  durationHours: number;
  departureAt: string;
  departureUntil: string | null;
}): { start: Date; end: Date } {
  if (trip.departureOpen) {
    const start = new Date(trip.publishedAt);
    const end = new Date(start.getTime() + trip.durationHours * 60 * 60 * 1000);
    return { start, end };
  }
  const start = new Date(trip.departureAt);
  const end = trip.departureUntil ? new Date(trip.departureUntil) : start;
  return { start, end };
}

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

/** Apply a calendar day onto an existing ISO datetime, preserving its local time. */
export function applyLocalDateToIso(
  iso: string | null,
  day: Date,
  fallbackHour: number,
): string {
  const existing = parseIsoDate(iso);
  const next = existing ? new Date(existing) : new Date();
  if (!existing) {
    next.setHours(fallbackHour, 0, 0, 0);
  }
  next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
  return next.toISOString();
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Monday-first weekday index 0–6. */
export function mondayFirstWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** True when start and end fall on different local calendar days. */
export function isMultiDayWindow(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
): boolean {
  const start = parseIsoDate(startIso ?? null);
  const end = parseIsoDate(endIso ?? null);
  if (!start || !end) {
    return false;
  }
  return !isSameLocalDay(start, end);
}

export function formatDateRangeLabel(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
  locale: string,
  fallback: string,
): string {
  const start = parseIsoDate(startIso ?? null);
  const end = parseIsoDate(endIso ?? null);
  const latinLocale = withLatinDigitsLocale(locale);
  const formatDay = (date: Date) =>
    date.toLocaleDateString(latinLocale, {
      day: 'numeric',
      month: 'short',
    });

  if (start && end) {
    if (isSameLocalDay(start, end)) {
      return formatDay(start);
    }
    return `${formatDay(start)} → ${formatDay(end)}`;
  }
  if (start) {
    return formatDay(start);
  }
  return fallback;
}

export function formatTripDateTime(
  iso: string | null | undefined,
  locale: string,
  fallback = '—',
  includeTime = true,
): string {
  if (!iso) {
    return fallback;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  const latinLocale = withLatinDigitsLocale(locale);
  const day = date.toLocaleDateString(latinLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  if (!includeTime) {
    return day;
  }
  const time = date.toLocaleTimeString(latinLocale, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} at ${time}`;
}
