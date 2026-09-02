import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY_URL =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
const FALLBACK_URL = 'https://latest.currency-api.pages.dev/v1/currencies/usd.json';
const CACHE_KEY = 'currency_rates_usd_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type RatesCache = { rates: Record<string, number>; fetchedAt: number };

let inFlight: Promise<Record<string, number> | null> | null = null;

async function fetchRates(): Promise<Record<string, number> | null> {
  for (const url of [PRIMARY_URL, FALLBACK_URL]) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = (await response.json()) as { usd?: Record<string, number> };
      if (data.usd && typeof data.usd === 'object') {
        return data.usd;
      }
    } catch {
      // try the next source
    }
  }
  return null;
}

/** USD-based conversion rates (units per 1 USD), cached at most once per day. */
export async function getUsdRates(): Promise<Record<string, number> | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as RatesCache;
      if (parsed.rates && Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
        return parsed.rates;
      }
    }
  } catch {
    // ignore corrupt cache
  }

  if (!inFlight) {
    inFlight = fetchRates().finally(() => {
      inFlight = null;
    });
  }
  const fetched = await inFlight;
  if (fetched) {
    try {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ rates: fetched, fetchedAt: Date.now() } satisfies RatesCache),
      );
    } catch {
      // ignore storage failures
    }
    return fetched;
  }

  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as RatesCache;
      if (parsed.rates) {
        return parsed.rates;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/** Converts a USD amount into `currencyCode` using the cached/live USD rates. Returns null if unavailable. */
export async function convertFromUsd(
  amountUsd: number,
  currencyCode: string,
): Promise<number | null> {
  const rates = await getUsdRates();
  const rate = rates?.[currencyCode.toLowerCase()];
  if (typeof rate !== 'number' || !Number.isFinite(rate)) {
    return null;
  }
  return amountUsd * rate;
}
