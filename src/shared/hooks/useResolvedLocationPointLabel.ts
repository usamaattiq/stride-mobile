import React from 'react';

import { isCoordinateLabel, resolveAddressLabel } from '@/features/auth/utils/geocodedAddressLabel';

type LocationPoint = {
  label: string;
  latitude: number;
  longitude: number;
};

export function useResolvedLocationPointLabel(
  point: LocationPoint | null | undefined,
  fallback = '—',
): string {
  const rawLabel = point?.label?.trim() ?? '';
  const shouldResolve =
    point != null &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    (!rawLabel || isCoordinateLabel(rawLabel));

  const [label, setLabel] = React.useState(rawLabel || fallback);

  React.useEffect(() => {
    if (!point) {
      setLabel(fallback);
      return;
    }

    if (!shouldResolve) {
      setLabel(rawLabel || fallback);
      return;
    }

    let cancelled = false;
    setLabel(rawLabel || fallback);

    void resolveAddressLabel(point.latitude, point.longitude).then((resolved) => {
      if (!cancelled) {
        setLabel(resolved || fallback);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fallback, point, rawLabel, shouldResolve]);

  return label;
}
