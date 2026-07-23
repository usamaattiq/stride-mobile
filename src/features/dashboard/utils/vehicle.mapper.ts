import type { VehicleDto, VehiclePayload } from '@/services/api/vehicleApi.types';

import type { Vehicle, VehicleDraft } from '../types/vehicle.types';
import { isVehicleDraftComplete } from '../types/vehicle.types';

export function mapVehicleDtoToVehicle(dto: VehicleDto): Vehicle {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    plateNumber: dto.plateNumber,
    hasAc: dto.hasAc,
    totalSeats: dto.totalSeats,
    vehicleClass: dto.vehicleClass,
    brand: dto.brand ?? '',
    model: dto.model ?? '',
    year: dto.year != null ? String(dto.year) : '',
    photoUris: [...dto.photoUrls],
    photoDisplayUris: dto.photoViewUrls?.length ? [...dto.photoViewUrls] : [...dto.photoUrls],
  };
}

export function draftToVehiclePayload(draft: VehicleDraft): VehiclePayload | null {
  if (!isVehicleDraftComplete(draft) || draft.photoUris.length === 0) {
    return null;
  }

  const seats = Number.parseInt(draft.totalSeats.trim(), 10);
  const yearTrimmed = draft.year.trim();
  const year = yearTrimmed.length > 0 ? Number.parseInt(yearTrimmed, 10) : null;

  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    plateNumber: draft.plateNumber.trim(),
    hasAc: draft.hasAc,
    totalSeats: seats,
    vehicleClass: draft.vehicleClass!,
    brand: draft.brand.trim() || null,
    model: draft.model.trim() || null,
    year: year != null && Number.isFinite(year) ? year : null,
    photoUrls: draft.photoUris.filter((uri) => uri.length > 0),
  };
}
