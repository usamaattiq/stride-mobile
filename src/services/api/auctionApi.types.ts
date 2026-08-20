export type AuctionType = "forward" | "reverse";

export type AuctionStatusValue =
  | "coming-soon"
  | "live"
  | "awaiting-confirmation"
  | "awaiting-action"
  | "awaiting-your-confirmation"
  | "declined"
  | "timed-out"
  | "completed"
  | "closed"
  | "expired";

export type AuctionDisplayVariant = "muted" | "accent" | "warning" | "success";

export type AuctionParticipantStatus =
  "active" | "withdrawn" | "declined" | "timed_out";

export type AuctionBidVehicleSummary = {
  id: string;
  title: string;
  vehicleClass: "suv" | "sedan" | "bus" | "van" | "coaster";
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

export type AuctionParticipantRank = {
  participantId: string;
  peakAmount: number;
  rank: number;
  participantName?: string | null;
  participantPhone?: string | null;
  vehicle?: AuctionBidVehicleSummary | null;
};

export type AuctionOwnerActions = {
  canSelectNext: boolean;
  canClose: boolean;
  canActivate: boolean;
};

export type AuctionParticipantActions = {
  canPlaceBid: boolean;
  canWithdraw: boolean;
  canConfirm: boolean;
  canDecline: boolean;
  isSelectedParticipant: boolean;
};

type AuctionSnapshotBase = {
  id: string;
  auctionType: AuctionType;
  status: AuctionStatusValue;
  statusLabel: string;
  statusVariant: AuctionDisplayVariant;
  lifecycleKey: string;
  state: string;
  startsAt: string | null;
  endsAt: string | null;
  secondsUntilStart: number;
  remainingSeconds: number | null;
  currentAmount: number;
  participantCount: number;
};

export type AuctionPublicSnapshot = AuctionSnapshotBase & {
  role: "public";
};

export type AuctionOwnerSnapshot = AuctionSnapshotBase & {
  role: "owner";
  platformId: string;
  externalRef: string | null;
  startingAmount: number | null;
  selectedParticipantId: string | null;
  confirmedParticipantId: string | null;
  confirmationDeadlineAt: string | null;
  ownerActionDeadlineAt: string | null;
  closedReason: string | null;
  ranking: AuctionParticipantRank[];
  actions: AuctionOwnerActions;
};

export type AuctionParticipantSnapshot = AuctionSnapshotBase & {
  role: "participant";
  platformId: string;
  externalRef: string | null;
  hasParticipated: boolean;
  participantStatus: AuctionParticipantStatus | null;
  myPeakAmount: number | null;
  isLeading: boolean | null;
  ranking: AuctionParticipantRank[] | null;
  minNextAmount: number | null;
  bidIncrement: number | null;
  confirmationDeadlineAt: string | null;
  confirmedParticipantId: string | null;
  actions: AuctionParticipantActions;
  ownerName?: string | null;
  ownerPhone?: string | null;
};

export type AuctionSnapshot =
  AuctionPublicSnapshot | AuctionOwnerSnapshot | AuctionParticipantSnapshot;

export type AuctionBidSummary = {
  id: string;
  participantId: string;
  amount: number;
  placedAt: string;
  participantStatus: AuctionParticipantStatus;
  participantName?: string | null;
  participantPhone?: string | null;
};

export type PlaceBidPayload = {
  amount: number;
  /** Required when bidding on a passenger request. */
  vehicleId?: string;
};
