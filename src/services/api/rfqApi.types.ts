export type RfqCapacityMode = 'full' | 'partial';

export type RfqOfferStatus =
  | 'active'
  | 'selected'
  | 'confirmed'
  | 'withdrawn'
  | 'declined'
  | 'timed_out';

export type RfqStatusValue =
  | 'draft'
  | 'scheduled'
  | 'live'
  | 'awaiting_confirmation'
  | 'completed'
  | 'closed'
  | 'expired'
  | 'cancelled';

export type RfqOfferSummary = {
  id: string;
  responderId: string;
  status: RfqOfferStatus;
  capacityMode: RfqCapacityMode;
  offeredQuantity: string | null;
  price: string | null;
  confirmationDeadlineAt: string | null;
};

export type RfqOwnerActions = {
  canSubmitOffer: boolean;
  canSelect: boolean;
  canClose: boolean;
  canCancel: boolean;
  canActivate: boolean;
};

export type RfqResponderActions = {
  canSubmitOffer: boolean;
  canWithdraw: boolean;
  canConfirm: boolean;
  canDecline: boolean;
};

export type RfqOwnerSnapshot = {
  role: 'owner';
  id: string;
  platformId: string;
  externalRef: string | null;
  status: RfqStatusValue;
  enforceCapacityLimit: boolean;
  totalQuantity: string | null;
  confirmedQuantity: string;
  remainingQuantity: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  closedAt: string | null;
  closedReason: 'owner_manual' | 'auto_no_deal' | null;
  offers: RfqOfferSummary[];
  actions: RfqOwnerActions;
};

export type RfqResponderSnapshot = {
  role: 'responder';
  id: string;
  platformId: string;
  externalRef: string | null;
  status: RfqStatusValue;
  enforceCapacityLimit: boolean;
  totalQuantity: string | null;
  confirmedQuantity: string;
  remainingQuantity: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  myOffers: RfqOfferSummary[];
  actions: RfqResponderActions;
};

export type RfqSnapshot = RfqOwnerSnapshot | RfqResponderSnapshot;

export type RfqOfferResponse = {
  id: string;
  rfqId: string;
  responderId: string;
  status: RfqOfferStatus;
  capacityMode: RfqCapacityMode;
  offeredQuantity: string | null;
  price: string | null;
  confirmationDeadlineAt: string | null;
};

export type SubmitOfferPayload = {
  seats: number;
  price?: number;
};
