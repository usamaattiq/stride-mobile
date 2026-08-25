import { apiRequest } from './client';
import type { PhoneIdentity } from './authApi.types';
import { getDeviceId } from '@/services/deviceId';

export type AdminDocumentStatus = {
  nicSubmitted: boolean;
  nicVerified: boolean;
  licenseSubmitted: boolean;
  licenseVerified: boolean;
  documentsSubmitted: boolean;
  fullyVerified: boolean;
};

export type AdminUserSummary = {
  id: string;
  fullName: string;
  phoneE164: string;
  email: string | null;
  role: 'passenger' | 'driver';
  credits: number;
  status: string;
  avatarViewUrl?: string | null;
  createdAt: string;
  documents: AdminDocumentStatus;
};

export type AdminUserDetail = AdminUserSummary & {
  address: string | null;
  countryCode: string;
  nicNumber: string | null;
  nicFrontViewUrl?: string | null;
  nicBackViewUrl?: string | null;
  driverLicenseNumber: string | null;
  driverLicenseFrontViewUrl?: string | null;
  driverLicenseBackViewUrl?: string | null;
};

export type AdminTripParticipant = {
  id: string;
  fullName: string;
  phoneE164: string;
  role: 'passenger' | 'driver';
};

export type AdminTripSummary = {
  id: string;
  referenceCode: string;
  listingType: 'rfq' | 'auction';
  routeType: 'land' | 'sea' | 'air';
  departureCityLabel: string;
  arrivalCityLabel: string;
  departureAt: string;
  status: string | null;
  statusLabel: string | null;
  owner: AdminTripParticipant;
  isPassengerRequest: boolean;
  publishedAt: string;
};

export type AdminTripDetail = AdminTripSummary & {
  description: string | null;
  vehicleMode: string;
  paymentMethod: string;
  startingPrice: string | null;
  driver: AdminTripParticipant | null;
  winningPassenger: AdminTripParticipant | null;
};

export type AdminCreditUser = {
  id: string;
  fullName: string;
  phoneE164: string;
  role: 'passenger' | 'driver';
  credits: number;
};

export type AdminSubzone = {
  id: string;
  name: string;
  cityId: string | null;
  cityLabel: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminProfile = {
  id: string;
  fullName: string;
  phoneE164: string;
  role: 'admin';
};

export type AdminUserFilter = 'all' | 'verified' | 'not_verified' | 'documents_submitted';

export const adminApi = {
  sendLoginOtp(phone: PhoneIdentity) {
    return apiRequest<{ sent: true }>({
      method: 'POST',
      url: '/admin/auth/login/otp/send',
      data: phone,
    });
  },

  verifyLoginOtp(phone: PhoneIdentity, otp: string) {
    return apiRequest<{ verified: true }>({
      method: 'POST',
      url: '/admin/auth/login/otp/verify',
      data: { ...phone, otp },
    });
  },

  async loginWithMpin(phone: PhoneIdentity, mpin: string) {
    const deviceId = await getDeviceId();
    return apiRequest<{ accessToken: string; profile: AdminProfile }>({
      method: 'POST',
      url: '/admin/auth/login/mpin',
      data: { ...phone, mpin, deviceId },
    });
  },

  getMe() {
    return apiRequest<AdminProfile>({ method: 'GET', url: '/admin/auth/me' });
  },

  logout() {
    return apiRequest<{ loggedOut: true }>({ method: 'POST', url: '/admin/auth/logout' });
  },

  listUsers(role: 'passenger' | 'driver', filter: AdminUserFilter, page = 1) {
    return apiRequest<{ items: AdminUserSummary[]; total: number }>({
      method: 'GET',
      url: '/admin/users',
      params: { role, filter, page, limit: 50 },
    });
  },

  getUser(userId: string) {
    return apiRequest<AdminUserDetail>({ method: 'GET', url: `/admin/users/${userId}` });
  },

  listTrips(page = 1) {
    return apiRequest<{ items: AdminTripSummary[]; total: number }>({
      method: 'GET',
      url: '/admin/trips',
      params: { page, limit: 50 },
    });
  },

  getTrip(tripId: string) {
    return apiRequest<AdminTripDetail>({ method: 'GET', url: `/admin/trips/${tripId}` });
  },

  listCredits() {
    return apiRequest<{ items: AdminCreditUser[] }>({ method: 'GET', url: '/admin/credits' });
  },

  updateCredits(userId: string, credits: number) {
    return apiRequest<AdminCreditUser>({
      method: 'PATCH',
      url: `/admin/credits/${userId}`,
      data: { credits },
    });
  },

  listSubzones() {
    return apiRequest<{ items: AdminSubzone[] }>({ method: 'GET', url: '/admin/subzones' });
  },

  createSubzone(input: {
    name: string;
    cityLabel: string;
    cityId?: string | null;
    isActive?: boolean;
  }) {
    return apiRequest<AdminSubzone>({
      method: 'POST',
      url: '/admin/subzones',
      data: input,
    });
  },

  updateSubzone(
    subzoneId: string,
    input: Partial<{
      name: string;
      cityLabel: string;
      cityId: string | null;
      isActive: boolean;
    }>,
  ) {
    return apiRequest<AdminSubzone>({
      method: 'PATCH',
      url: `/admin/subzones/${subzoneId}`,
      data: input,
    });
  },

  deleteSubzone(subzoneId: string) {
    return apiRequest<{ deleted: true }>({
      method: 'DELETE',
      url: `/admin/subzones/${subzoneId}`,
    });
  },
};
