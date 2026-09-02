import React from 'react';

import { convertFromUsd } from '@/shared/services/currencyRates';

/** Live-converts a USD amount into `currencyCode` for display. Returns null while loading/unavailable. */
export function useConvertedAmount(amountUsd: number, currencyCode: string): number | null {
  const [converted, setConverted] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (currencyCode.toUpperCase() === 'USD' || !Number.isFinite(amountUsd)) {
      setConverted(currencyCode.toUpperCase() === 'USD' ? amountUsd : null);
      return () => {
        cancelled = true;
      };
    }
    void convertFromUsd(amountUsd, currencyCode).then((value) => {
      if (!cancelled) {
        setConverted(value);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [amountUsd, currencyCode]);

  return converted;
}
