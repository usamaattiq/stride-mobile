export type RfqCapacityMode = 'full' | 'partial';

/** Persisted offer statuses from RMS (`OfferStatus`). */
export type RfqOfferStatus =
  | 'active'
  | 'selected'
  | 'confirmed'
  | 'withdrawn'
  | 'declined'
  | 'timed_out'
  | 'lapsed';

/**
 * Role-tagged display statuses from RMS. Never the raw DB enum.
 */
export type RfqStatusValue =
  | 'live'
  | 'awaiting-confirmation'
  | 'offer-submitted'
  | 'awaiting-your-confirmation'
  | 'confirmed'
  | 'completed'
  | 'closed'
  | 'expired';

export type RfqDisplayVariant = 'muted' | 'accent' | 'warning' | 'success';

export type RfqOfferVehicleSummary = {
  id: string;
  title: string;
  vehicleClass: 'suv' | 'sedan' | 'bus' | 'van' | 'coaster';
  totalSeats: number;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  photoUrl: string | null;
  photoViewUrl?: string | null;
  description?: string;
  hasAc?: boolean;
  year?: number | null;
  photoUrls?: string[];
  photoDisplayUris?: string[];
};

export type RfqOfferSummary = {
  id: string;
  responderId: string;
  /** Masked until contact exchange; full name while exchange is allowed. */
  responderName?: string | null;
  /** Phone only while contact exchange is allowed. */
  responderPhone?: string | null;
  status: RfqOfferStatus;
  capacityMode: RfqCapacityMode;
  offeredQuantity: string | null;
  price: string | null;
  confirmationDeadlineAt: string | null;
  contactExchangeAllowed?: boolean;
  contactExchangeClosesAt?: string | null;
  /** Driver vehicle attached when offering on a passenger request. */
  vehicle?: RfqOfferVehicleSummary | null;
};

export type RfqOwnerActions = {
  canSubmitOffer: boolean;
  canSelect: boolean;
  canClose: boolean;
  canComplete: boolean;
};

export type RfqResponderActions = {
  canSubmitOffer: boolean;
  canWithdraw: boolean;
  canConfirm: boolean;
  canDecline: boolean;
};

type RfqSnapshotBase = {
  id: string;
  status: RfqStatusValue;
  statusLabel?: string;
  statusVariant?: RfqDisplayVariant;
  enforceCapacityLimit: boolean;
  totalQuantity: string | null;
  confirmedQuantity: string;
  remainingQuantity?: string | null;
  availableQuantity?: string | null;
  expiresAt: string | null;
};

export type RfqOwnerSnapshot = RfqSnapshotBase & {
  role: 'owner';
  platformId: string;
  externalRef: string | null;
  reservedQuantity?: string;
  closedAt: string | null;
  closedReason: 'owner_manual' | 'auto_no_deal' | null;
  offers: RfqOfferSummary[];
  actions: RfqOwnerActions;
};

export type RfqResponderSnapshot = RfqSnapshotBase & {
  role: 'responder';
  platformId: string;
  externalRef: string | null;
  myOffers: RfqOfferSummary[];
  actions: RfqResponderActions;
  ownerName?: string | null;
  ownerPhone?: string | null;
};

export type RfqPublicSnapshot = RfqSnapshotBase & {
  role: 'public';
};

export type RfqSnapshot = RfqOwnerSnapshot | RfqResponderSnapshot | RfqPublicSnapshot;

export type RfqOfferResponse = {
  id: string;
  rfqId: string;
  responderId: string;
  status: RfqOfferStatus;
  capacityMode: RfqCapacityMode;
  offeredQuantity: string | null;
  price: string | null;
  confirmationDeadlineAt: string | null;
  contactExchangeAllowed?: boolean;
  contactExchangeClosesAt?: string | null;
  vehicle?: RfqOfferVehicleSummary | null;
};

export type SubmitOfferPayload = {
  seats: number;
  price?: number;
  /** Required when offering on a passenger request. */
  vehicleId?: string;
};
