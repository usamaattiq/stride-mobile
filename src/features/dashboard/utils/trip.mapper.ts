import type { CreateTripPayload, TripDto } from '@/services/api/tripApi.types';
import { formatPriceAmount } from '@/shared/utils/latin-digits';

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
    listingVehicle: dto.listingVehicle ?? null,
    routeType: dto.routeType ?? 'land',
    luggage: dto.luggage
      ? {
          option: dto.luggage.option,
          type: dto.luggage.type,
          lengthCm: dto.luggage.lengthCm,
          widthCm: dto.luggage.widthCm,
          weightKg: dto.luggage.weightKg,
          items: dto.luggage.items ?? (dto.luggage.option === 'checked'
            ? [
                {
                  type: dto.luggage.type,
                  lengthCm: dto.luggage.lengthCm,
                  widthCm: dto.luggage.widthCm,
                  weightKg: dto.luggage.weightKg,
                },
              ]
            : []),
        }
      : null,
    vehicleMode: dto.vehicleMode,
    departureCity: dto.departureCity,
    departurePoint: dto.departurePoint,
    departureAt: dto.departureAt,
    departureUntil: dto.departureUntil ?? null,
    departureOpen: Boolean(dto.departureOpen),
    departureTimeSet: dto.departureTimeSet !== false,
    arrivalCity: dto.arrivalCity,
    arrivalPoint: dto.arrivalPoint,
    arrivalAt: dto.arrivalAt,
    arrivalOpen: Boolean(dto.arrivalOpen),
    arrivalTimeSet: dto.arrivalTimeSet === true,
    listingType: dto.listingType,
    referenceCode: dto.referenceCode ?? null,
    startingPrice: dto.startingPrice
      ? formatPriceAmount(dto.startingPrice) || dto.startingPrice
      : null,
    paymentMethod: dto.paymentMethod,
    durationHours: dto.durationHours,
    startMode: dto.startMode,
    scheduledStartAt: dto.scheduledStartAt,
    description: dto.description ?? null,
    publishedAt: dto.publishedAt,
    rfqStatus: dto.rfqStatus ?? null,
    auctionStatus: dto.auctionStatus ?? null,
    auctionStatusLabel: dto.auctionStatusLabel ?? null,
    auctionStatusVariant: dto.auctionStatusVariant ?? null,
    auctionRemainingSeconds: dto.auctionRemainingSeconds ?? null,
    myOfferStatus: dto.myOfferStatus ?? null,
    myOfferPrice: dto.myOfferPrice
      ? formatPriceAmount(dto.myOfferPrice) || dto.myOfferPrice
      : null,
    myBidStatus: dto.myBidStatus ?? null,
    myBidAmount: dto.myBidAmount ?? null,
    counterpartyName: dto.counterpartyName ?? null,
    counterpartyPhone: dto.counterpartyPhone ?? null,
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
    departureOpen: preview.departureOpen,
    departureTimeSet: preview.departureTimeSet,
    arrivalCity: preview.arrivalCity,
    arrivalPoint: preview.arrivalPoint,
    arrivalAt: preview.arrivalAt,
    arrivalOpen: preview.arrivalOpen,
    arrivalTimeSet: preview.arrivalTimeSet,
    listingType: preview.listingType,
    ...(preview.startingPrice ? { startingPrice: preview.startingPrice } : {}),
    ...(preview.vehicleClass && !preview.vehicleId && preview.vehicleTotalSeats != null
      ? { seats: preview.vehicleTotalSeats }
      : {}),
    ...(!preview.vehicleId && !preview.vehicleClass && preview.vehicleTotalSeats != null
      ? { seats: preview.vehicleTotalSeats }
      : {}),
    routeType: preview.routeType,
    ...(preview.luggage
      ? {
          luggageOption: preview.luggage.option,
          luggageType: preview.luggage.type,
          luggageLengthCm: preview.luggage.lengthCm,
          luggageWidthCm: preview.luggage.widthCm,
          luggageWeightKg: preview.luggage.weightKg,
          luggageItems: preview.luggage.items?.length
            ? preview.luggage.items
            : preview.luggage.option === 'checked'
              ? [
                  {
                    type: preview.luggage.type,
                    lengthCm: preview.luggage.lengthCm,
                    widthCm: preview.luggage.widthCm,
                    weightKg: preview.luggage.weightKg,
                  },
                ]
              : [],
        }
      : {}),
    paymentMethod: preview.paymentMethod,
    durationHours: preview.durationHours,
    startMode: preview.startMode,
    scheduledStartAt: preview.scheduledStartAt,
    description: preview.description,
  };
}
