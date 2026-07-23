export type TripVehicleMode = 'shared' | 'fullPrivate';
export type TripListingType = 'rfq' | 'auction';
export type TripPaymentMethod = 'cash' | 'online';
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
  departureAt: string | null;
  arrivalCity: TripCity | null;
  arrivalPoint: TripLocationPoint | null;
  arrivalAt: string | null;
  listingType: TripListingType | null;
  startingPrice: string;
  paymentMethod: TripPaymentMethod | null;
  durationHours: number;
  startMode: TripStartMode | null;
  scheduledStartAt: string | null;
};

export type Trip = {
  id: string;
  vehicleId: string;
  vehicleTitle: string | null;
  vehicleMode: TripVehicleMode;
  departureCity: TripCity;
  departurePoint: TripLocationPoint;
  departureAt: string;
  arrivalCity: TripCity;
  arrivalPoint: TripLocationPoint;
  arrivalAt: string;
  listingType: TripListingType;
  startingPrice: string | null;
  paymentMethod: TripPaymentMethod;
  durationHours: number;
  startMode: TripStartMode;
  scheduledStartAt: string | null;
  publishedAt: string;
};

export function createEmptyTripDraft(): TripDraft {
  return {
    vehicleId: null,
    vehicleMode: null,
    departureCity: null,
    departurePoint: null,
    departureAt: null,
    arrivalCity: null,
    arrivalPoint: null,
    arrivalAt: null,
    listingType: null,
    startingPrice: '',
    paymentMethod: null,
    durationHours: 6,
    startMode: null,
    scheduledStartAt: null,
  };
}

export function isTripDraftComplete(draft: TripDraft): boolean {
  return draftToTrip(draft, 'preview') !== null;
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
    vehicleMode: draft.vehicleMode,
    departureCity: draft.departureCity,
    departurePoint: draft.departurePoint,
    departureAt: draft.departureAt,
    arrivalCity: draft.arrivalCity,
    arrivalPoint: draft.arrivalPoint,
    arrivalAt: draft.arrivalAt,
    listingType: draft.listingType,
    startingPrice: trimmedPrice,
    paymentMethod: draft.paymentMethod,
    durationHours: draft.durationHours,
    startMode: draft.startMode,
    scheduledStartAt: draft.startMode === 'scheduled' ? draft.scheduledStartAt : null,
    publishedAt: new Date().toISOString(),
  };
}
