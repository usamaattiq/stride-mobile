import type { AuctionStatusValue } from '@/services/api/auctionApi.types';
import type {
  AdminTripDetail,
  AdminTripSummary,
  AdminUserDetail,
  AdminUserSummary,
} from '@/services/api/adminApi';
import type { RfqStatusValue } from '@/services/api/rfqApi.types';

import type { HomeMessage, MessageAvatarTone } from '@/features/dashboard/types/messages.types';
import type { Trip } from '@/features/dashboard/types/trip.types';

function initialsForName(fullName: string): string {
  return fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function verificationPreview(user: AdminUserSummary): string {
  const parts = [
    user.documents.nicVerified
      ? 'NIC verified'
      : user.documents.nicSubmitted
        ? 'NIC submitted'
        : 'NIC missing',
  ];

  if (user.role === 'driver') {
    parts.push(
      user.documents.licenseVerified
        ? 'License verified'
        : user.documents.licenseSubmitted
          ? 'License submitted'
          : 'License missing',
    );
  }

  return parts.join(' · ');
}

function verificationSubtitle(user: AdminUserSummary): string {
  if (user.documents.fullyVerified) {
    return 'Verified';
  }
  if (user.documents.documentsSubmitted) {
    return 'Documents submitted';
  }
  return 'Not verified';
}

function avatarToneForRole(role: AdminUserSummary['role']): MessageAvatarTone {
  return role === 'driver' ? 'green' : 'blue';
}

export function mapAdminUserSummaryToMessage(user: AdminUserSummary): HomeMessage {
  return {
    id: user.id,
    tripId: user.id,
    listingType: user.role === 'driver' ? 'auction' : 'rfq',
    offerId: null,
    counterpartyId: user.id,
    counterpartyRole: user.role,
    viewerIsOwner: true,
    senderName: user.fullName,
    preview: `${user.phoneE164} · ${verificationPreview(user)}`,
    timeLabel: `${user.credits} credits`,
    unread: user.documents.documentsSubmitted && !user.documents.fullyVerified,
    avatar: {
      initials: initialsForName(user.fullName),
      tone: avatarToneForRole(user.role),
      ...(user.avatarViewUrl ? { imageUri: user.avatarViewUrl } : {}),
    },
    context: {
      kind: user.role === 'driver' ? 'auction' : 'rfq',
      title: user.role === 'driver' ? 'Driver' : 'Passenger',
      subtitle: verificationSubtitle(user),
    },
  };
}

export function mapAdminUserDetailToMessage(user: AdminUserDetail): HomeMessage {
  return mapAdminUserSummaryToMessage(user);
}

function mapAdminPaymentMethod(value: string | undefined): Trip['paymentMethod'] {
  if (value === 'ONLINE') return 'online';
  if (value === 'BOTH') return 'both';
  return 'cash';
}

function mapAdminStatusVariant(
  value: string | null | undefined,
): Trip['auctionStatusVariant'] {
  if (value === 'muted' || value === 'accent' || value === 'warning' || value === 'success') {
    return value;
  }
  return null;
}

export function mapAdminTripSummaryToTrip(trip: AdminTripSummary): Trip {
  const rfqStatus =
    trip.listingType === 'rfq' && trip.status
      ? (trip.status as RfqStatusValue)
      : null;
  const auctionStatus =
    trip.listingType === 'auction' && trip.status
      ? (trip.status as AuctionStatusValue)
      : null;

  const vehiclePhotoViewUrls = trip.vehiclePhotoViewUrls ?? [];
  const vehiclePhotoViewUrl = trip.vehiclePhotoViewUrl ?? vehiclePhotoViewUrls[0] ?? null;

  return {
    id: trip.id,
    vehicleId: trip.isPassengerRequest ? null : trip.id,
    vehicleTitle: null,
    vehiclePhotoUrl: vehiclePhotoViewUrl,
    vehiclePhotoUrls: vehiclePhotoViewUrls,
    vehiclePhotoCount: vehiclePhotoViewUrls.length || (vehiclePhotoViewUrl ? 1 : 0),
    vehicleClass: trip.vehicleClass ?? (trip.isPassengerRequest ? 'sedan' : null),
    vehicleTotalSeats: trip.vehicleTotalSeats ?? (trip.isPassengerRequest ? 4 : null),
    listingVehicle: null,
    routeType: trip.routeType,
    luggage: null,
    vehicleMode: trip.vehicleMode === 'FULL_PRIVATE' ? 'fullPrivate' : 'shared',
    departureCity: { id: `${trip.id}-from`, label: trip.departureCityLabel },
    departurePoint: { label: trip.departureCityLabel, latitude: 0, longitude: 0 },
    departureAt: trip.departureAt,
    departureUntil: null,
    departureOpen: false,
    departureTimeSet: true,
    arrivalCity: { id: `${trip.id}-to`, label: trip.arrivalCityLabel },
    arrivalPoint: { label: trip.arrivalCityLabel, latitude: 0, longitude: 0 },
    arrivalAt: trip.departureAt,
    arrivalOpen: false,
    arrivalTimeSet: true,
    listingType: trip.listingType,
    referenceCode: trip.referenceCode,
    startingPrice: trip.startingPrice ?? null,
    paymentMethod: mapAdminPaymentMethod(trip.paymentMethod),
    durationHours: trip.durationHours ?? 24,
    startMode: trip.startMode === 'SCHEDULED' ? 'scheduled' : 'instant',
    scheduledStartAt: trip.scheduledStartAt ?? null,
    description: null,
    publishedAt: trip.publishedAt,
    rfqStatus,
    auctionStatus,
    auctionStatusLabel: trip.statusLabel,
    auctionStatusVariant: mapAdminStatusVariant(trip.statusVariant),
    auctionRemainingSeconds: null,
    myOfferStatus: null,
    myOfferPrice: null,
    myBidStatus: null,
    myBidAmount: null,
    counterpartyName: null,
    counterpartyPhone: null,
  };
}

export function mapAdminTripDetailToTrip(trip: AdminTripDetail): Trip {
  const base = mapAdminTripSummaryToTrip(trip);
  return {
    ...base,
    vehicleMode: trip.vehicleMode === 'FULL_PRIVATE' ? 'fullPrivate' : 'shared',
    paymentMethod: mapAdminPaymentMethod(trip.paymentMethod),
    startingPrice: trip.startingPrice,
    description: trip.description,
  };
}

export function formatAdminTripDeparture(trip: AdminTripDetail): string {
  const date = new Date(trip.departureAt);
  if (Number.isNaN(date.getTime())) {
    return trip.departureAt;
  }
  return date.toLocaleString();
}
