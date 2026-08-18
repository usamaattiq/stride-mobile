import React from 'react';

import type { TripCity } from '@/features/dashboard/types/trip.types';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ENV } from '@/shared/config/env';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { resolveLocalizedCityName } from '@/shared/utils/localized-city-name';

type Point = {
  latitude: number;
  longitude: number;
} | null | undefined;

export function useLocalizedCityName(city: TripCity | null | undefined, point?: Point): string {
  const { currentLanguage } = useLanguage();
  const fallback = city ? cityDisplayName(city.label) : '';
  const [label, setLabel] = React.useState(fallback);

  React.useEffect(() => {
    setLabel(fallback);
  }, [fallback]);

  React.useEffect(() => {
    if (!city) {
      return;
    }
    let cancelled = false;
    void resolveLocalizedCityName({
      city,
      latitude: point?.latitude,
      longitude: point?.longitude,
      language: currentLanguage,
      apiKey: ENV.googleMapsApiKey,
    }).then((name) => {
      if (!cancelled && name) {
        setLabel(name);
      }
    });
    return () => {
      cancelled = true;
    };
    // city.id / city.label identify the place; the object reference is not stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [city?.id, city?.label, currentLanguage, point?.latitude, point?.longitude]);

  return label;
}
