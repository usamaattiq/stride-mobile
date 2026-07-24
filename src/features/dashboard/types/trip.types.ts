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
  paymentMethod: TripPaymentMethod | null;
  durationHours: number;
  startMode: TripStartMode | null;
  scheduledStartAt: string | null;
  /** Optional free-text trip notes. */
  description: string;
};

export type Trip = {
  id: string;
  vehicleId: string;
  vehicleTitle: string | null;
  vehiclePhotoUrl: string | null;
  vehiclePhotoCount: number;
  vehicleClass: VehicleClass | null;
  vehicleTotalSeats: number | null;
  vehicleMode: TripVehicleMode;
  departureCity: TripCity;
  departurePoint: TripLocationPoint;
  departureAt: string;
  /** End of the departure date window, when set. */
  departureUntil: string | null;
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
};

export function createEmptyTripDraft(): TripDraft {
  return {
    vehicleId: null,
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
    paymentMethod: null,
    durationHours: 6,
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
  if (
    !draft.vehicleId ||
    !draft.vehicleMode ||
    !draft.departureCity ||
    !draft.departurePoint ||
    !draft.departureAt ||
    !draft.arrivalCity ||
    !draft.arrivalPoint ||
    !draft.arrivalAt ||
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
  if (!trimmedPrice) {
    return null;
  }

  return {
    id,
    vehicleId: draft.vehicleId,
    vehicleTitle: null,
    vehiclePhotoUrl: null,
    vehiclePhotoCount: 0,
    vehicleClass: null,
    vehicleTotalSeats: null,
    vehicleMode: draft.vehicleMode,
    departureCity: draft.departureCity,
    departurePoint: draft.departurePoint,
    departureAt: draft.departureAt,
    departureUntil: draft.departureUntil,
    arrivalCity: draft.arrivalCity,
    arrivalPoint: draft.arrivalPoint,
    arrivalAt: draft.arrivalAt,
    listingType: draft.listingType,
    startingPrice: trimmedPrice,
    paymentMethod: draft.paymentMethod,
    durationHours: draft.durationHours,
    startMode: draft.startMode,
    scheduledStartAt: draft.startMode === 'scheduled' ? draft.scheduledStartAt : null,
    description: draft.description.trim() || null,
    publishedAt: new Date().toISOString(),
  };
}
