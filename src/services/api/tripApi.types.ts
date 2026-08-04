import type { RfqStatusValue } from './rfqApi.types';

export type TripCityDto = {
  id: string;
  label: string;
};

export type TripLocationPointDto = {
  label: string;
  latitude: number;
  longitude: number;
};

export type TripDto = {
  id: string;
  vehicleId: string | null;
  vehicleTitle: string | null;
  vehiclePhotoUrls: string[];
  vehiclePhotoViewUrl?: string | null;
  vehiclePhotoViewUrls?: string[];
  vehicleClass: 'suv' | 'sedan' | 'bus' | 'van' | 'coaster' | null;
  vehicleTotalSeats: number | null;
  vehicleMode: 'shared' | 'fullPrivate';
  departureCity: TripCityDto;
  departurePoint: TripLocationPointDto;
  departureAt: string;
  departureUntil: string | null;
  arrivalCity: TripCityDto;
  arrivalPoint: TripLocationPointDto;
  arrivalAt: string;
  listingType: 'rfq' | 'auction';
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
  arrivalCity: TripCityDto;
  arrivalPoint: TripLocationPointDto;
  arrivalAt: string;
  listingType: 'rfq' | 'auction';
  /** Required for driver listings; omitted for passenger requests. */
  startingPrice?: string;
  /** Required for passenger requests when vehicleId is omitted. */
  seats?: number;
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
  arrivalCity?: string;
  vehicleMode?: 'shared' | 'fullPrivate';
  vehicleClass?: 'suv' | 'sedan' | 'bus' | 'van' | 'coaster';
  minSeats?: number;
  page?: number;
  limit?: number;
};
