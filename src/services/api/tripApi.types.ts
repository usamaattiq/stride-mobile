import type { AuctionParticipantStatus, AuctionStatusValue } from './auctionApi.types';
import type { RfqOfferStatus, RfqOfferVehicleSummary, RfqStatusValue } from './rfqApi.types';

export type TripCityDto = {
  id: string;
  label: string;
};

export type TripLocationPointDto = {
  label: string;
  latitude: number;
  longitude: number;
};

export type TripLuggagePieceDto = {
  type: 'suitcase' | 'backpack' | 'duffel' | 'box' | 'other' | null;
  lengthCm: number | null;
  widthCm: number | null;
  weightKg: number | null;
};

export type TripLuggageDto = {
  option: 'handCarry' | 'checked';
  type: 'suitcase' | 'backpack' | 'duffel' | 'box' | 'other' | null;
  lengthCm: number | null;
  widthCm: number | null;
  weightKg: number | null;
  items?: TripLuggagePieceDto[];
};

export type TripDto = {
  id: string;
  vehicleId: string | null;
  vehicleTitle: string | null;
  vehiclePhotoUrls: string[];
  listingVehicle?: RfqOfferVehicleSummary | null;
  vehiclePhotoViewUrl?: string | null;
  vehiclePhotoViewUrls?: string[];
  vehicleClass: 'suv' | 'sedan' | 'bus' | 'van' | 'coaster' | null;
  vehicleTotalSeats: number | null;
  routeType?: 'land' | 'sea' | 'air';
  luggage?: TripLuggageDto | null;
  vehicleMode: 'shared' | 'fullPrivate';
  departureCity: TripCityDto;
  departurePoint: TripLocationPointDto;
  departureAt: string;
  departureUntil: string | null;
  departureOpen: boolean;
  departureTimeSet?: boolean;
  arrivalCity: TripCityDto;
  arrivalPoint: TripLocationPointDto;
  arrivalAt: string;
  arrivalOpen?: boolean;
  arrivalTimeSet?: boolean;
  listingType: 'rfq' | 'auction';
  /** Public listing code, e.g. AUC-2026-1234. */
  referenceCode: string;
  startingPrice: string | null;
  paymentMethod: 'cash' | 'online' | 'both';
  durationHours: number;
  startMode: 'instant' | 'scheduled';
  scheduledStartAt: string | null;
  description: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  /** RFQ status exactly as returned by rfq-management-system. Only populated for the owning driver's own listings. */
  rfqStatus?: RfqStatusValue | null;
  /** Auction display status from AMS. Only populated for the owner's auction listings. */
  auctionStatus?: AuctionStatusValue | null;
  /** AMS status_label — render as-is. */
  auctionStatusLabel?: string | null;
  auctionStatusVariant?: 'muted' | 'accent' | 'warning' | 'success' | null;
  auctionRemainingSeconds?: number | null;
  /** Viewer's latest offer status when listed via My Offers. */
  myOfferStatus?: RfqOfferStatus | null;
  /** Viewer's latest offer price when listed via My Offers. */
  myOfferPrice?: string | null;
  /** Viewer's auction bid status when listed via My Offers. */
  myBidStatus?: AuctionParticipantStatus | null;
  myBidAmount?: number | null;
  /** Listing owner contact once a confirmed offer unlocks exchange. */
  counterpartyName?: string | null;
  counterpartyPhone?: string | null;
};

export type CreateTripPayload = {
  vehicleId?: string;
  /** Required for passenger requests when vehicleId is omitted. */
  vehicleClass?: 'suv' | 'sedan' | 'bus' | 'van' | 'coaster';
  vehicleMode: 'shared' | 'fullPrivate';
  departureCity: TripCityDto;
  departurePoint: TripLocationPointDto;
  departureAt: string;
  departureUntil?: string | null;
  departureOpen?: boolean;
  departureTimeSet?: boolean;
  arrivalCity: TripCityDto;
  arrivalPoint: TripLocationPointDto;
  arrivalAt: string;
  arrivalOpen?: boolean;
  arrivalTimeSet?: boolean;
  listingType: 'rfq' | 'auction';
  /** Required for driver listings; omitted for passenger requests. */
  startingPrice?: string;
  /** Required for passenger requests when vehicleId is omitted. */
  seats?: number;
  routeType?: 'land' | 'sea' | 'air';
  luggageOption?: 'handCarry' | 'checked' | null;
  luggageType?: 'suitcase' | 'backpack' | 'duffel' | 'box' | 'other' | null;
  luggageLengthCm?: number | null;
  luggageWidthCm?: number | null;
  luggageWeightKg?: number | null;
  luggageItems?: TripLuggagePieceDto[];
  paymentMethod: 'cash' | 'online' | 'both';
  durationHours: number;
  startMode: 'instant' | 'scheduled';
  scheduledStartAt?: string | null;
  description?: string | null;
};

export type PaginatedTripsDto = {
  items: TripDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type BrowseTripsParams = {
  q?: string;
  /** `trips` = driver vehicle listings; `requests` = passenger reverse requests. */
  kind?: 'trips' | 'requests';
  listingType?: 'rfq' | 'auction';
  paymentMethod?: 'cash' | 'online' | 'both';
  departureCity?: string;
  departureCityId?: string;
  arrivalCity?: string;
  arrivalCityId?: string;
  vehicleMode?: 'shared' | 'fullPrivate';
  vehicleClass?: 'suv' | 'sedan' | 'bus' | 'van' | 'coaster';
  minSeats?: number;
  page?: number;
  limit?: number;
};

export type TerminalKind = 'airport' | 'seaport';

export type TerminalSearchItemDto = {
  id: string;
  code: string;
  label: string;
  latitude: number;
  longitude: number;
};

export type TripSubzonePointDto = {
  id: string;
  name: string;
  cityId: string | null;
  cityLabel: string;
  latitude: number;
  longitude: number;
};

