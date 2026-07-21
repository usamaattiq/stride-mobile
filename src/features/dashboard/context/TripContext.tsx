import React from 'react';

import {
  createEmptyTripDraft,
  draftToTrip,
  type Trip,
  type TripDraft,
} from '../types/trip.types';

type TripContextValue = {
  trips: Trip[];
  draft: TripDraft;
  beginCreateTrip: () => void;
  patchDraft: (partial: Partial<TripDraft>) => void;
  clearDraft: () => void;
  publishDraft: () => Trip | null;
  getTripById: (tripId: string) => Trip | undefined;
};

const TripContext = React.createContext<TripContextValue | null>(null);

function createTripId(): string {
  return `trip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function TripProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [draft, setDraft] = React.useState<TripDraft>(createEmptyTripDraft);

  const clearDraft = React.useCallback(() => {
    setDraft(createEmptyTripDraft());
  }, []);

  const beginCreateTrip = React.useCallback(() => {
    setDraft(createEmptyTripDraft());
  }, []);

  const patchDraft = React.useCallback((partial: Partial<TripDraft>) => {
    setDraft((current) => ({ ...current, ...partial }));
  }, []);

  const getTripById = React.useCallback(
    (tripId: string) => trips.find((item) => item.id === tripId),
    [trips],
  );

  const publishDraft = React.useCallback(() => {
    const trip = draftToTrip(draft, createTripId());
    if (!trip) {
      return null;
    }

    setTrips((current) => [...current, trip]);
    clearDraft();
    return trip;
  }, [clearDraft, draft]);

  const value = React.useMemo(
    () => ({
      trips,
      draft,
      beginCreateTrip,
      patchDraft,
      clearDraft,
      publishDraft,
      getTripById,
    }),
    [trips, draft, beginCreateTrip, patchDraft, clearDraft, publishDraft, getTripById],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrips(): TripContextValue {
  const context = React.useContext(TripContext);
  if (!context) {
    throw new Error('useTrips must be used within TripProvider');
  }
  return context;
}
