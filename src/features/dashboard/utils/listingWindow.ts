import type { Trip } from '../types/trip.types';

type ListingClockTrip = Pick<Trip, 'publishedAt' | 'scheduledStartAt' | 'durationHours'>;

/** Go-live instant: scheduled start when set, otherwise publish time. */
export function getListingStartsAtMs(trip: ListingClockTrip): number {
  const scheduled = trip.scheduledStartAt ? Date.parse(trip.scheduledStartAt) : Number.NaN;
  if (Number.isFinite(scheduled)) {
    return scheduled;
  }
  return Date.parse(trip.publishedAt);
}

/** Listing duration is measured from go-live, not from when the trip was created. */
export function getListingExpiresAtMs(trip: ListingClockTrip): number {
  return getListingStartsAtMs(trip) + trip.durationHours * 60 * 60 * 1000;
}

export function isListingNotStartedYet(trip: ListingClockTrip, now = Date.now()): boolean {
  return getListingStartsAtMs(trip) > now;
}
