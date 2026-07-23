import React from 'react';

import { i18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { vehicleApi } from '@/services/api/vehicleApi';

import {
  createEmptyVehicleDraft,
  vehicleToDraft,
  type Vehicle,
  type VehicleDraft,
} from '../types/vehicle.types';
import { draftToVehiclePayload, mapVehicleDtoToVehicle } from '../utils/vehicle.mapper';

type VehicleContextValue = {
  vehicles: Vehicle[];
  draft: VehicleDraft;
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  beginAddVehicle: () => void;
  beginEditVehicle: (vehicleId: string) => boolean;
  patchDraft: (partial: Partial<VehicleDraft>) => void;
  clearDraft: () => void;
  refreshVehicles: () => Promise<void>;
  saveDraftVehicle: (partial?: Partial<VehicleDraft>) => Promise<Vehicle | null>;
  removeVehicle: (vehicleId: string) => Promise<void>;
  getVehicleById: (vehicleId: string) => Vehicle | undefined;
};

const VehicleContext = React.createContext<VehicleContextValue | null>(null);

export function VehicleProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [draft, setDraft] = React.useState<VehicleDraft>(createEmptyVehicleDraft);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const refreshVehicles = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const list = await vehicleApi.list();
      setVehicles(list.map(mapVehicleDtoToVehicle));
    } catch (error) {
      setLoadError(getErrorMessage(error, i18n.t('vehicles.loadFailed')));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshVehicles().catch(() => undefined);
  }, [refreshVehicles]);

  const clearDraft = React.useCallback(() => {
    setDraft(createEmptyVehicleDraft());
  }, []);

  const beginAddVehicle = React.useCallback(() => {
    setDraft(createEmptyVehicleDraft());
  }, []);

  const getVehicleById = React.useCallback(
    (vehicleId: string) => vehicles.find((item) => item.id === vehicleId),
    [vehicles],
  );

  const beginEditVehicle = React.useCallback(
    (vehicleId: string) => {
      const vehicle = vehicles.find((item) => item.id === vehicleId);
      if (!vehicle) {
        return false;
      }
      setDraft(vehicleToDraft(vehicle));
      return true;
    },
    [vehicles],
  );

  const patchDraft = React.useCallback((partial: Partial<VehicleDraft>) => {
    setDraft((current) => ({ ...current, ...partial }));
  }, []);

  const saveDraftVehicle = React.useCallback(
    async (partial?: Partial<VehicleDraft>) => {
      const merged = { ...draft, ...partial };
      const payload = draftToVehiclePayload(merged);
      if (!payload) {
        return null;
      }

      setIsSaving(true);
      try {
        const savedDto = merged.id
          ? await vehicleApi.update(merged.id, payload)
          : await vehicleApi.create(payload);
        const saved = mapVehicleDtoToVehicle(savedDto);

        setVehicles((current) => {
          const existingIndex = current.findIndex((item) => item.id === saved.id);
          if (existingIndex === -1) {
            return [saved, ...current];
          }
          const next = [...current];
          next[existingIndex] = saved;
          return next;
        });
        clearDraft();
        return saved;
      } finally {
        setIsSaving(false);
      }
    },
    [clearDraft, draft],
  );

  const removeVehicle = React.useCallback(async (vehicleId: string) => {
    setIsSaving(true);
    try {
      await vehicleApi.remove(vehicleId);
      setVehicles((current) => current.filter((item) => item.id !== vehicleId));
      setDraft((current) =>
        current.id === vehicleId ? createEmptyVehicleDraft() : current,
      );
    } finally {
      setIsSaving(false);
    }
  }, []);

  const value = React.useMemo(
    () => ({
      vehicles,
      draft,
      isLoading,
      isSaving,
      loadError,
      beginAddVehicle,
      beginEditVehicle,
      patchDraft,
      clearDraft,
      refreshVehicles,
      saveDraftVehicle,
      removeVehicle,
      getVehicleById,
    }),
    [
      vehicles,
      draft,
      isLoading,
      isSaving,
      loadError,
      beginAddVehicle,
      beginEditVehicle,
      patchDraft,
      clearDraft,
      refreshVehicles,
      saveDraftVehicle,
      removeVehicle,
      getVehicleById,
    ],
  );

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
}

export function useVehicles(): VehicleContextValue {
  const context = React.useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicles must be used within VehicleProvider');
  }
  return context;
}
