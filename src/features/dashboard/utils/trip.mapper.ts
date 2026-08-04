import type { CreateTripPayload, TripDto } from '@/services/api/tripApi.types';

import { draftToTrip, type Trip, type TripDraft } from '../types/trip.types';

export function mapTripDtoToTrip(dto: TripDto): Trip {
  return {
    id: dto.id,
    vehicleId: dto.vehicleId,
    vehicleTitle: dto.vehicleTitle,
    vehiclePhotoUrl:
      dto.vehiclePhotoViewUrl ?? dto.vehiclePhotoUrls[0] ?? null,
    vehiclePhotoUrls: dto.vehiclePhotoViewUrls?.length
      ? dto.vehiclePhotoViewUrls
      : dto.vehiclePhotoUrls,
    vehiclePhotoCount: dto.vehiclePhotoUrls.length,
    vehicleClass: dto.vehicleClass,
    vehicleTotalSeats: dto.vehicleTotalSeats,
    vehicleMode: dto.vehicleMode,
    departureCity: dto.departureCity,
    departurePoint: dto.departurePoint,
    departureAt: dto.departureAt,
    departureUntil: dto.departureUntil ?? null,
    arrivalCity: dto.arrivalCity,
    arrivalPoint: dto.arrivalPoint,
    arrivalAt: dto.arrivalAt,
    listingType: dto.listingType,
    startingPrice: dto.startingPrice,
    paymentMethod: dto.paymentMethod,
    durationHours: dto.durationHours,
    startMode: dto.startMode,
    scheduledStartAt: dto.scheduledStartAt,
    description: dto.description ?? null,
    publishedAt: dto.publishedAt,
    rfqStatus: dto.rfqStatus ?? null,
  };
}

export function draftToCreateTripPayload(draft: TripDraft): CreateTripPayload | null {
  const preview = draftToTrip(draft, 'preview');
  if (!preview) {
    return null;
  }

  return {
    ...(preview.vehicleId ? { vehicleId: preview.vehicleId } : {}),
    ...(preview.vehicleClass && !preview.vehicleId
      ? { vehicleClass: preview.vehicleClass }
      : {}),
    vehicleMode: preview.vehicleMode,
    departureCity: preview.departureCity,
    departurePoint: preview.departurePoint,
    departureAt: preview.departureAt,
    departureUntil: preview.departureUntil,
    arrivalCity: preview.arrivalCity,
    arrivalPoint: preview.arrivalPoint,
    arrivalAt: preview.arrivalAt,
    listingType: preview.listingType,
    ...(preview.startingPrice ? { startingPrice: preview.startingPrice } : {}),
    paymentMethod: preview.paymentMethod,
    durationHours: preview.durationHours,
    startMode: preview.startMode,
    scheduledStartAt: preview.scheduledStartAt,
    description: preview.description,
  };
}
