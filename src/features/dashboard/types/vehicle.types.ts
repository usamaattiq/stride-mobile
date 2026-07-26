export type VehicleClass =
  | 'suv'
  | 'sedan'
  | 'bus'
  | 'van'
  | 'coaster'
  | 'hiace'
  | 'minibus'
  | 'pickup';

export type Vehicle = {
  id: string;
  title: string;
  description: string;
  plateNumber: string;
  hasAc: boolean;
  totalSeats: number;
  vehicleClass: VehicleClass;
  brand: string;
  model: string;
  year: string;
  /** Stable file URLs (or local URIs while drafting). Persist these. */
  photoUris: string[];
  /** Fresh view URLs for <Image>; falls back to photoUris when absent. */
  photoDisplayUris?: string[];
};

export type VehicleDraft = {
  id?: string;
  title: string;
  description: string;
  plateNumber: string;
  hasAc: boolean;
  totalSeats: string;
  vehicleClass: VehicleClass | null;
  brand: string;
  model: string;
  year: string;
  photoUris: string[];
};

export function createEmptyVehicleDraft(): VehicleDraft {
  return {
    title: '',
    description: '',
    plateNumber: '',
    hasAc: true,
    totalSeats: '',
    vehicleClass: null,
    brand: '',
    model: '',
    year: '',
    photoUris: [],
  };
}

export function vehicleToDraft(vehicle: Vehicle): VehicleDraft {
  return {
    id: vehicle.id,
    title: vehicle.title,
    description: vehicle.description,
    plateNumber: vehicle.plateNumber,
    hasAc: vehicle.hasAc,
    totalSeats: String(vehicle.totalSeats),
    vehicleClass: vehicle.vehicleClass,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    photoUris: [...vehicle.photoUris],
  };
}

export function isVehicleDraftComplete(draft: VehicleDraft): boolean {
  const seats = Number.parseInt(draft.totalSeats.trim(), 10);
  return (
    draft.title.trim().length > 0 &&
    draft.description.trim().length > 0 &&
    draft.plateNumber.trim().length > 0 &&
    draft.vehicleClass !== null &&
    Number.isFinite(seats) &&
    seats > 0
  );
}

export function draftToVehicle(draft: VehicleDraft, id: string): Vehicle | null {
  if (!isVehicleDraftComplete(draft)) {
    return null;
  }

  const seats = Number.parseInt(draft.totalSeats.trim(), 10);

  return {
    id,
    title: draft.title.trim(),
    description: draft.description.trim(),
    plateNumber: draft.plateNumber.trim(),
    hasAc: draft.hasAc,
    totalSeats: seats,
    vehicleClass: draft.vehicleClass!,
    brand: draft.brand.trim(),
    model: draft.model.trim(),
    year: draft.year.trim(),
    photoUris: draft.photoUris,
  };
}
