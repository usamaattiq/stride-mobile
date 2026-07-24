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
  vehicleId: string;
  vehicleTitle: string | null;
  vehiclePhotoUrls: string[];
  vehiclePhotoViewUrl?: string | null;
  vehicleClass: 'suv' | 'sedan' | 'bus' | 'van' | 'coaster' | 'hiace' | 'minibus' | 'pickup' | null;
  vehicleTotalSeats: number | null;
  vehicleMode: 'shared' | 'fullPrivate';
  departureCity: TripCityDto;
  departurePoint: TripLocationPointDto;
  departureAt: string;
  arrivalCity: TripCityDto;
  arrivalPoint: TripLocationPointDto;
  arrivalAt: string;
  listingType: 'rfq' | 'auction';
  startingPrice: string | null;
  paymentMethod: 'cash' | 'online';
  durationHours: number;
  startMode: 'instant' | 'scheduled';
  scheduledStartAt: string | null;
  description: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateTripPayload = {
  vehicleId: string;
  vehicleMode: 'shared' | 'fullPrivate';
  departureCity: TripCityDto;
  departurePoint: TripLocationPointDto;
  departureAt: string;
  arrivalCity: TripCityDto;
  arrivalPoint: TripLocationPointDto;
  arrivalAt: string;
  listingType: 'rfq' | 'auction';
  startingPrice: string;
  paymentMethod: 'cash' | 'online';
  durationHours: number;
  startMode: 'instant' | 'scheduled';
  scheduledStartAt?: string | null;
  description?: string | null;
};
