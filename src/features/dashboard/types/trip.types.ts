import type { AuctionParticipantStatus, AuctionStatusValue } from '@/services/api/auctionApi.types';
import type { RfqOfferStatus, RfqStatusValue } from '@/services/api/rfqApi.types';

import type { VehicleClass } from './vehicle.types';

export type TripVehicleMode = 'shared' | 'fullPrivate';
export type TripListingType = 'rfq' | 'auction';
export type TripPaymentMethod = 'cash' | 'online' | 'both';
export type TripStartMode = 'instant' | 'scheduled';

export type TripCity = {
  id: string;
  label: string;
};

export type TripLocationPoint = {
  label: string;
  latitude: number;
  longitude: number;
};

export type TripDraft = {
  vehicleId: string | null;
  /** Passenger requests pick a class instead of a concrete vehicle. */
  vehicleClass: VehicleClass | null;
  vehicleMode: TripVehicleMode | null;
  departureCity: TripCity | null;
  departurePoint: TripLocationPoint | null;
  /** Start of the departure date window. */
  departureAt: string | null;
  /** End of the departure date window. */
  departureUntil: string | null;
  /** Whether the user explicitly picked a departure time (vs. the default baked into departureAt). */
  departureTimeSet: boolean;
  arrivalCity: TripCity | null;
  arrivalPoint: TripLocationPoint | null;
  arrivalAt: string | null;
  /** Whether the user explicitly picked an arrival time (vs. the default baked into arrivalAt). */
  arrivalTimeSet: boolean;
  listingType: TripListingType | null;
  startingPrice: string;
  /** Passenger requests: number of seats needed (string for text input). */
  seats: string;
  paymentMethod: TripPaymentMethod | null;
  durationHours: number;
  startMode: TripStartMode | null;
  scheduledStartAt: string | null;
  /** Optional free-text trip notes. */
  description: string;
};

export type Trip = {
  id: string;
  vehicleId: string | null;
  vehicleTitle: string | null;
  vehiclePhotoUrl: string | null;
  vehiclePhotoUrls: string[];
  vehiclePhotoCount: number;
  vehicleClass: VehicleClass | null;
  vehicleTotalSeats: number | null;
  vehicleMode: TripVehicleMode;
  departureCity: TripCity;
  departurePoint: TripLocationPoint;
  departureAt: string;
  /** End of the departure date window, when set. */
  departureUntil: string | null;
  /** True when the creator skipped a departure time — card shows "Open". */
  departureOpen: boolean;
  arrivalCity: TripCity;
  arrivalPoint: TripLocationPoint;
  arrivalAt: string;
  listingType: TripListingType;
  startingPrice: string | null;
  paymentMethod: TripPaymentMethod;
  durationHours: number;
  startMode: TripStartMode;
  scheduledStartAt: string | null;
  description: string | null;
  publishedAt: string;
  /** RFQ status exactly as returned by rfq-management-system. Only populated for the owning driver's own listings. */
  rfqStatus: RfqStatusValue | null;
  /** Auction display status from AMS. */
  auctionStatus: AuctionStatusValue | null;
  /** AMS status_label — render as-is. */
  auctionStatusLabel: string | null;
  auctionStatusVariant: 'muted' | 'accent' | 'warning' | 'success' | null;
  auctionRemainingSeconds: number | null;
  /** Viewer's latest offer status when shown on My Offers. */
  myOfferStatus: RfqOfferStatus | null;
  /** Viewer's latest offer price when shown on My Offers. */
  myOfferPrice: string | null;
  /** Viewer's auction bid status when shown on My Offers. */
  myBidStatus: AuctionParticipantStatus | null;
  myBidAmount: number | null;
  /** Listing owner contact once confirmed (My Offers). */
  counterpartyName: string | null;
  counterpartyPhone: string | null;
};

export function createEmptyTripDraft(): TripDraft {
  return {
    vehicleId: null,
    vehicleClass: null,
    vehicleMode: null,
    departureCity: null,
    departurePoint: null,
    departureAt: null,
    departureUntil: null,
    departureTimeSet: false,
    arrivalCity: null,
    arrivalPoint: null,
    arrivalAt: null,
    arrivalTimeSet: false,
    listingType: null,
    startingPrice: '',
    seats: '1',
    paymentMethod: null,
    durationHours: 24,
    startMode: null,
    scheduledStartAt: null,
    description: '',
  };
}

export function isTripDraftComplete(draft: TripDraft): boolean {
  return draftToTrip(draft, 'preview') !== null;
}

/** Minimum fields required to publish (matches create API). */
export function canPublishTripDraft(draft: TripDraft): boolean {
  return isTripDraftComplete(draft);
}

export function draftToTrip(draft: TripDraft, id: string): Trip | null {
  const departureRequired = draft.vehicleMode === 'shared';
  const hasVehicle = Boolean(draft.vehicleId);
  const hasVehicleClass = Boolean(draft.vehicleClass);

  if (
    (!hasVehicle && !hasVehicleClass) ||
    !draft.vehicleMode ||
    !draft.departureCity ||
    (departureRequired && !draft.departureAt) ||
    !draft.arrivalCity ||
    !draft.listingType ||
    !draft.paymentMethod ||
    !draft.startMode
  ) {
    return null;
  }

  if (draft.startMode === 'scheduled' && !draft.scheduledStartAt) {
    return null;
  }

  const trimmedPrice = draft.startingPrice.trim();
  // Passenger requests (vehicle class only) do not set a price per seat.
  if (hasVehicle && !trimmedPrice) {
    return null;
  }

  const seatsParsed = Number.parseInt(draft.seats.trim(), 10);
  const seatsValid =
    Number.isInteger(seatsParsed) && seatsParsed >= 1 && seatsParsed <= 50;
  if (hasVehicleClass && !hasVehicle && !seatsValid) {
    return null;
  }

  const departurePoint =
    draft.departurePoint ??
    ({
      label: draft.departureCity.label,
      latitude: 0,
      longitude: 0,
    } satisfies TripLocationPoint);

  const arrivalPoint =
    draft.arrivalPoint ??
    ({
      label: draft.arrivalCity.label,
      latitude: 0,
      longitude: 0,
    } satisfies TripLocationPoint);

  // Private / auction can skip departure — start now and stay "Open" for durationHours.
  const isPrivate =
    draft.listingType === 'auction' || draft.vehicleMode === 'fullPrivate';
  const departureOpen = isPrivate && !draft.departureAt;
  const now = new Date();
  const durationMs = draft.durationHours * 60 * 60 * 1000;
  const departureAt = departureOpen
    ? now.toISOString()
    : (draft.departureAt ?? now.toISOString());
  const departureUntil = departureOpen
    ? new Date(now.getTime() + durationMs).toISOString()
    : draft.departureUntil;

  // When arrival isn't set, place it after the departure window so API validation passes.
  const departureWindowEndMs = new Date(departureUntil ?? departureAt).getTime();
  const arrivalAt =
    draft.arrivalAt ??
    new Date(departureWindowEndMs + 60 * 60 * 1000).toISOString();

  return {
    id,
    vehicleId: draft.vehicleId,
    vehicleTitle: null,
    vehiclePhotoUrl: null,
    vehiclePhotoUrls: [],
    vehiclePhotoCount: 0,
    vehicleClass: draft.vehicleClass,
    vehicleTotalSeats: hasVehicleClass && !hasVehicle ? seatsParsed : null,
    vehicleMode: draft.listingType === 'auction' ? 'fullPrivate' : draft.vehicleMode,
    departureCity: draft.departureCity,
    departurePoint,
    departureAt,
    departureUntil,
    departureOpen,
    arrivalCity: draft.arrivalCity,
    arrivalPoint,
    arrivalAt,
    listingType: draft.listingType,
    startingPrice: trimmedPrice || null,
    paymentMethod: draft.paymentMethod,
    durationHours: draft.durationHours,
    startMode: draft.startMode,
    scheduledStartAt: draft.startMode === 'scheduled' ? draft.scheduledStartAt : null,
    description: draft.description.trim() || null,
    publishedAt: new Date().toISOString(),
    rfqStatus: null,
    auctionStatus: null,
    auctionStatusLabel: null,
    auctionStatusVariant: null,
    auctionRemainingSeconds: null,
    myOfferStatus: null,
    myOfferPrice: null,
    myBidStatus: null,
    myBidAmount: null,
    counterpartyName: null,
    counterpartyPhone: null,
  };
}
