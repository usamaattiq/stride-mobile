import React from 'react';

import {
  createEmptyVehicleDraft,
  draftToVehicle,
  vehicleToDraft,
  type Vehicle,
  type VehicleDraft,
} from '../types/vehicle.types';

type VehicleContextValue = {
  vehicles: Vehicle[];
  draft: VehicleDraft;
  beginAddVehicle: () => void;
  beginEditVehicle: (vehicleId: string) => boolean;
  patchDraft: (partial: Partial<VehicleDraft>) => void;
  clearDraft: () => void;
  saveDraftVehicle: (partial?: Partial<VehicleDraft>) => Vehicle | null;
  removeVehicle: (vehicleId: string) => void;
  getVehicleById: (vehicleId: string) => Vehicle | undefined;
};

const VehicleContext = React.createContext<VehicleContextValue | null>(null);

function createVehicleId(): string {
  return `vehicle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function VehicleProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [draft, setDraft] = React.useState<VehicleDraft>(createEmptyVehicleDraft);

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

  const saveDraftVehicle = React.useCallback((partial?: Partial<VehicleDraft>) => {
    const merged = { ...draft, ...partial };
    const id = merged.id ?? createVehicleId();
    const vehicle = draftToVehicle(merged, id);
    if (!vehicle) {
      return null;
    }

    setVehicles((current) => {
      const existingIndex = current.findIndex((item) => item.id === id);
      if (existingIndex === -1) {
        return [...current, vehicle];
      }
      const next = [...current];
      next[existingIndex] = vehicle;
      return next;
    });
    clearDraft();
    return vehicle;
  }, [clearDraft, draft]);

  const removeVehicle = React.useCallback((vehicleId: string) => {
    setVehicles((current) => current.filter((item) => item.id !== vehicleId));
    setDraft((current) => (current.id === vehicleId ? createEmptyVehicleDraft() : current));
  }, []);

  const value = React.useMemo(
    () => ({
      vehicles,
      draft,
      beginAddVehicle,
      beginEditVehicle,
      patchDraft,
      clearDraft,
      saveDraftVehicle,
      removeVehicle,
      getVehicleById,
    }),
    [
      vehicles,
      draft,
      beginAddVehicle,
      beginEditVehicle,
      patchDraft,
      clearDraft,
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
