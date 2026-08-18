import type { VehicleDraft } from '../types/vehicle.types';

export type VehicleDetailsField =
  | 'title'
  | 'description'
  | 'plateNumber'
  | 'totalSeats'
  | 'vehicleClass'
  | 'brand'
  | 'model'
  | 'year';

export type VehicleFieldErrors = Partial<Record<VehicleDetailsField, string>>;

const LIMITS = {
  title: 120,
  description: 1000,
  plateNumber: 32,
  brand: 80,
  model: 80,
  seatsMin: 1,
  seatsMax: 60,
  yearMin: 1900,
  yearMax: 2100,
} as const;

type ErrorKey =
  | 'titleRequired'
  | 'titleTooLong'
  | 'descriptionTooLong'
  | 'plateRequired'
  | 'plateTooLong'
  | 'seatsRequired'
  | 'seatsInvalid'
  | 'classRequired'
  | 'brandTooLong'
  | 'modelTooLong'
  | 'yearInvalid';

function errorKeyPath(key: ErrorKey): string {
  return `vehicles.errors.${key}`;
}

export function getVehicleFieldErrorKey(
  field: VehicleDetailsField,
  draft: VehicleDraft,
): string | undefined {
  switch (field) {
    case 'title': {
      const value = draft.title.trim();
      if (!value) {
        return errorKeyPath('titleRequired');
      }
      if (value.length > LIMITS.title) {
        return errorKeyPath('titleTooLong');
      }
      return undefined;
    }
    case 'description': {
      const value = draft.description.trim();
      if (value.length > LIMITS.description) {
        return errorKeyPath('descriptionTooLong');
      }
      return undefined;
    }
    case 'plateNumber': {
      const value = draft.plateNumber.trim();
      if (!value) {
        return errorKeyPath('plateRequired');
      }
      if (value.length > LIMITS.plateNumber) {
        return errorKeyPath('plateTooLong');
      }
      return undefined;
    }
    case 'totalSeats': {
      const raw = draft.totalSeats.trim();
      if (!raw) {
        return errorKeyPath('seatsRequired');
      }
      const seats = Number.parseInt(raw, 10);
      if (
        !Number.isFinite(seats) ||
        seats < LIMITS.seatsMin ||
        seats > LIMITS.seatsMax
      ) {
        return errorKeyPath('seatsInvalid');
      }
      return undefined;
    }
    case 'vehicleClass':
      return draft.vehicleClass ? undefined : errorKeyPath('classRequired');
    case 'brand': {
      const value = draft.brand.trim();
      if (value.length > LIMITS.brand) {
        return errorKeyPath('brandTooLong');
      }
      return undefined;
    }
    case 'model': {
      const value = draft.model.trim();
      if (value.length > LIMITS.model) {
        return errorKeyPath('modelTooLong');
      }
      return undefined;
    }
    case 'year': {
      const value = draft.year.trim();
      if (!value) {
        return undefined;
      }
      if (!/^\d{4}$/.test(value)) {
        return errorKeyPath('yearInvalid');
      }
      const year = Number.parseInt(value, 10);
      if (year < LIMITS.yearMin || year > LIMITS.yearMax) {
        return errorKeyPath('yearInvalid');
      }
      return undefined;
    }
    default:
      return undefined;
  }
}

const ALL_FIELDS: VehicleDetailsField[] = [
  'title',
  'description',
  'plateNumber',
  'totalSeats',
  'vehicleClass',
  'brand',
  'model',
  'year',
];

export function getVehicleDetailsErrors(
  draft: VehicleDraft,
  translate: (key: string) => string,
  fields: readonly VehicleDetailsField[] = ALL_FIELDS,
): VehicleFieldErrors {
  const errors: VehicleFieldErrors = {};
  for (const field of fields) {
    const key = getVehicleFieldErrorKey(field, draft);
    if (key) {
      errors[field] = translate(key);
    }
  }
  return errors;
}

export function isVehicleDetailsValid(draft: VehicleDraft): boolean {
  return ALL_FIELDS.every((field) => !getVehicleFieldErrorKey(field, draft));
}
