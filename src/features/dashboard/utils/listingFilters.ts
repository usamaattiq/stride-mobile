import type { AuctionStatusValue } from '@/services/api/auctionApi.types';
import type { RfqStatusValue } from '@/services/api/rfqApi.types';

import type { TripListingCategory } from '../types/tripBrowse.types';
import type { Trip, TripListingType } from '../types/trip.types';
import { getListingExpiresAtMs } from './listingWindow';

export type ListingStatusFilter = 'all' | 'live' | 'past' | 'completed';

const LIVE_RFQ_STATUSES: ReadonlySet<RfqStatusValue> = new Set([
  'live',
  'awaiting-confirmation',
  'offer-submitted',
  'awaiting-your-confirmation',
  'confirmed',
]);

const PAST_RFQ_STATUSES: ReadonlySet<RfqStatusValue> = new Set(['closed', 'expired']);

const LIVE_AUCTION_STATUSES: ReadonlySet<AuctionStatusValue> = new Set([
  'coming-soon',
  'live',
  'awaiting-confirmation',
  'awaiting-action',
  'awaiting-your-confirmation',
]);

const PAST_AUCTION_STATUSES: ReadonlySet<AuctionStatusValue> = new Set([
  'closed',
  'expired',
  'declined',
  'timed-out',
]);

function getExpiresAt(trip: Trip): number {
  return getListingExpiresAtMs(trip);
}

/** Maps a trip into the Live / Past / Completed buckets used by My Listings filters. */
export function getListingStatusBucket(trip: Trip, now = Date.now()): Exclude<ListingStatusFilter, 'all'> {
  if (trip.auctionStatus === 'completed' || trip.rfqStatus === 'completed') {
    return 'completed';
  }
  if (trip.auctionStatus && PAST_AUCTION_STATUSES.has(trip.auctionStatus)) {
    return 'past';
  }
  if (trip.rfqStatus && PAST_RFQ_STATUSES.has(trip.rfqStatus)) {
    return 'past';
  }
  if (trip.auctionStatus && LIVE_AUCTION_STATUSES.has(trip.auctionStatus)) {
    return 'live';
  }
  if (trip.rfqStatus && LIVE_RFQ_STATUSES.has(trip.rfqStatus)) {
    return 'live';
  }
  // Fallback to the publish window when status isn't enriched yet.
  return getExpiresAt(trip) > now ? 'live' : 'past';
}

export function isTerminalListingStatus(status: string | null | undefined): boolean {
  const normalized = status?.replaceAll('_', '-') ?? '';
  return (
    normalized === 'completed' ||
    normalized === 'closed' ||
    normalized === 'expired' ||
    normalized === 'declined' ||
    normalized === 'timed-out'
  );
}

export function matchesListingType(trip: Trip, listingType: TripListingType): boolean {
  return trip.listingType === listingType;
}

export function matchesListingCategory(trip: Trip, category: TripListingCategory): boolean {
  if (category === 'all') {
    return true;
  }
  return trip.listingType === category;
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
