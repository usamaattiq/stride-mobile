import type { RfqStatusValue } from '@/services/api/rfqApi.types';

import type { Trip, TripListingType } from '../types/trip.types';

export type ListingStatusFilter = 'all' | 'live' | 'past' | 'completed';

const LIVE_STATUSES: ReadonlySet<RfqStatusValue> = new Set([
  'live',
  'awaiting-confirmation',
  'offer-submitted',
  'awaiting-your-confirmation',
  'confirmed',
]);

const PAST_STATUSES: ReadonlySet<RfqStatusValue> = new Set(['closed', 'expired']);

function getExpiresAt(trip: Trip): number {
  return new Date(trip.publishedAt).getTime() + trip.durationHours * 60 * 60 * 1000;
}

/** Maps a trip into the Live / Past / Completed buckets used by My Listings filters. */
export function getListingStatusBucket(trip: Trip, now = Date.now()): Exclude<ListingStatusFilter, 'all'> {
  if (trip.rfqStatus === 'completed') {
    return 'completed';
  }
  if (trip.rfqStatus && PAST_STATUSES.has(trip.rfqStatus)) {
    return 'past';
  }
  if (trip.rfqStatus && LIVE_STATUSES.has(trip.rfqStatus)) {
    return 'live';
  }
  // Auctions (or trips without RFQ status) fall back to the publish window.
  return getExpiresAt(trip) > now ? 'live' : 'past';
}

export function matchesListingType(trip: Trip, listingType: TripListingType): boolean {
  return trip.listingType === listingType;
}

export function matchesListingStatus(
  trip: Trip,
  status: ListingStatusFilter,
  now = Date.now(),
): boolean {
  if (status === 'all') {
    return true;
  }
  return getListingStatusBucket(trip, now) === status;
}

export function matchesListingQuery(trip: Trip, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  const haystack = [
    trip.departureCity.label,
    trip.arrivalCity.label,
    trip.vehicleTitle ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(normalized);
}
