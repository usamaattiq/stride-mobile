/** Local calendar-day helpers (ignore time-of-day for range comparison). */

import { withLatinDigitsLocale } from '@/shared/utils/latin-digits';

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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
  const time = date.toLocaleTimeString(latinLocale, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} at ${time}`;
}
