/**
 * Keep Western (0–9) digits in Arabic UI. Eastern Arabic / Persian numerals
 * sit low and get clipped in Cairo on iOS.
 */

const EASTERN_ARABIC_DIGITS = /[\u0660-\u0669]/g;
const PERSIAN_DIGITS = /[\u06F0-\u06F9]/g;

/** Convert Eastern Arabic / Persian digits to Latin 0–9. */
export function toLatinDigits(value: string): string {
  return value
    .replace(EASTERN_ARABIC_DIGITS, (digit) =>
      String(digit.charCodeAt(0) - 0x0660),
    )
    .replace(PERSIAN_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x06F0));
}

/** Normalize any digit script to Latin, then keep only 0–9. */
export function onlyLatinDigits(value: string): string {
  return toLatinDigits(value).replace(/\D/g, '');
}

/**
 * Arabic locale that still formats numbers with Latin digits
 * (e.g. dates stay Arabic month names, but "31" not "٣١").
 */
export function withLatinDigitsLocale(locale: string): string {
  const base = (locale.split(/[-_]/)[0] ?? locale).toLowerCase();
  if (base === 'ar') {
    return 'ar-u-nu-latn';
  }
  return locale;
}

/** Always format a number with Latin digits (grouping via en-US). */
export function formatLatinNumber(value: number): string {
  return toLatinDigits(value.toLocaleString('en-US'));
}

/**
 * Display a PKR amount without trailing `.00` from Decimal/Numeric APIs.
 * Whole rupees are shown as integers with no grouping (e.g. `1500`).
 */
export function formatPriceAmount(value: string | number | null | undefined): string {
  if (value == null) {
    return '';
  }
  const raw = typeof value === 'number' ? String(value) : value.trim();
  if (!raw) {
    return '';
  }
  const parsed = Number(raw.replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(parsed)) {
    return raw.replace(/\.0+$/, '');
  }
  return toLatinDigits(String(Math.round(parsed)));
}
