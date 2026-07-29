import React from 'react';

import { tripApi } from '@/services/api/tripApi';
import { useProfileStore } from '@/store/profileStore';

import {
  createEmptyTripDraft,
  type Trip,
  type TripDraft,
} from '../types/trip.types';
import { draftToCreateTripPayload, mapTripDtoToTrip } from '../utils/trip.mapper';

type TripContextValue = {
  trips: Trip[];
  draft: TripDraft;
  isLoading: boolean;
  isPublishing: boolean;
  loadError: string | null;
  beginCreateTrip: () => void;
  patchDraft: (partial: Partial<TripDraft>) => void;
  clearDraft: () => void;
  refreshTrips: () => Promise<void>;
  publishDraft: () => Promise<Trip | null>;
  removeTrip: (tripId: string) => Promise<void>;
  getTripById: (tripId: string) => Trip | undefined;
};

const TripContext = React.createContext<TripContextValue | null>(null);

export function TripProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [draft, setDraft] = React.useState<TripDraft>(createEmptyTripDraft);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const refreshTrips = React.useCallback(async () => {
    const role = useProfileStore.getState().profile?.role;
    if (role !== 'driver') {
      setTrips([]);
      setLoadError(null);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const list = await tripApi.list();
      setTrips(list.map(mapTripDtoToTrip));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load trips');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const publishDraft = React.useCallback(async () => {
    const payload = draftToCreateTripPayload(draft);
    if (!payload) {
      return null;
    }

    setIsPublishing(true);
    try {
      const created = await tripApi.create(payload);
      const trip = mapTripDtoToTrip(created);
      setTrips((current) => [trip, ...current]);
      clearDraft();
      return trip;
    } finally {
      setIsPublishing(false);
    }
  }, [clearDraft, draft]);

  const removeTrip = React.useCallback(async (tripId: string) => {
    await tripApi.remove(tripId);
    setTrips((current) => current.filter((item) => item.id !== tripId));
  }, []);

  const value = React.useMemo(
    () => ({
      trips,
      draft,
      isLoading,
      isPublishing,
      loadError,
      beginCreateTrip,
      patchDraft,
      clearDraft,
      refreshTrips,
      publishDraft,
      removeTrip,
      getTripById,
    }),
    [
      trips,
      draft,
      isLoading,
      isPublishing,
      loadError,
      beginCreateTrip,
      patchDraft,
      clearDraft,
      refreshTrips,
      publishDraft,
      removeTrip,
      getTripById,
    ],
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
