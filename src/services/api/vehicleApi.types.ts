export type VehicleClassDto =
  | 'suv'
  | 'sedan'
  | 'bus'
  | 'van'
  | 'coaster'
  | 'hiace'
  | 'minibus'
  | 'pickup';

export type VehicleDto = {
  id: string;
  title: string;
  description: string;
  plateNumber: string;
  hasAc: boolean;
  totalSeats: number;
  vehicleClass: VehicleClassDto;
  brand: string | null;
  model: string | null;
  year: number | null;
  photoUrls: string[];
  photoViewUrls?: string[];
  createdAt: string;
  updatedAt: string;
};

export type VehiclePayload = {
  title: string;
  description: string;
  plateNumber: string;
  hasAc: boolean;
  totalSeats: number;
  vehicleClass: VehicleClassDto;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  photoUrls: string[];
};
