import { ApiError } from '@/services/api/apiError';

import type { TripCreationStep } from '../types/trip.types';

export type CreateTripFieldIssue = {
  path: string;
  message: string;
};

function normalizePath(path: string): string {
  return path.replace(/^body\.?/, '').replace(/\[(\d+)\]/g, '.$1');
}

function issuesFromDetails(details: unknown): CreateTripFieldIssue[] {
  if (!details || typeof details !== 'object') {
    return [];
  }
  const record = details as {
    issues?: Array<{ path?: unknown; message?: unknown }>;
    fieldErrors?: Record<string, string[] | undefined>;
  };
  if (Array.isArray(record.issues) && record.issues.length > 0) {
    return record.issues
      .map((issue) => ({
        path: normalizePath(
          Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path ?? ''),
        ),
        message: typeof issue.message === 'string' ? issue.message : '',
      }))
      .filter((issue) => issue.path || issue.message);
  }
  if (record.fieldErrors) {
    return Object.entries(record.fieldErrors).flatMap(([path, messages]) =>
      (messages ?? []).map((message) => ({ path: normalizePath(path), message })),
    );
  }
  return [];
}

export function stepForCreateTripPath(path: string): TripCreationStep {
  const key = normalizePath(path).split('.')[0] ?? '';
  if (key === 'routeType') {
    return 'routeType';
  }
  if (key === 'vehicleId' || key === 'vehicleClass') {
    return 'vehicle';
  }
  if (key === 'vehicleMode') {
    return 'vehicleMode';
  }
  if (
    key.startsWith('luggage') ||
    key === 'luggageOption' ||
    key === 'luggageItems' ||
    key === 'luggageType'
  ) {
    return 'luggage';
  }
  if (key === 'listingType' || key === 'durationHours' || key === 'startingPrice') {
    return 'listing';
  }
  if (key === 'startMode' || key === 'scheduledStartAt') {
    return 'schedule';
  }
  return 'details';
}

export function mapCreateTripValidationError(error: unknown): {
  step: TripCreationStep;
  message: string;
  issues: CreateTripFieldIssue[];
} | null {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_ERROR') {
    return null;
  }
  const issues = issuesFromDetails(error.details);
  const first = issues[0];
  const step = first ? stepForCreateTripPath(first.path) : 'details';
  const message = first?.message?.trim() || error.message;
  if (!message || message === 'Validation failed') {
    return { step, message: '', issues };
  }
  return { step, message, issues };
}
