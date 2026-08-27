import { apiRequest } from './client';
import type { PhoneIdentity } from './authApi.types';
import { getDeviceId } from '@/services/deviceId';

export type IdentityDocumentStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export type AdminDocumentStatus = {
  nicSubmitted: boolean;
  nicVerified: boolean;
  nicStatus: IdentityDocumentStatus;
  licenseSubmitted: boolean;
  licenseVerified: boolean;
  licenseStatus: IdentityDocumentStatus;
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
  nicRejectionReason?: string | null;
  driverLicenseNumber: string | null;
  driverLicenseFrontViewUrl?: string | null;
  driverLicenseBackViewUrl?: string | null;
  licenseRejectionReason?: string | null;
};

export type AdminTripParticipant = {
  id: string;
  fullName: string;
  phoneE164: string;
  role: 'passenger' | 'driver';
  avatarViewUrl?: string | null;
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
  vehiclePhotoViewUrl?: string | null;
  vehiclePhotoViewUrls?: string[];
  vehicleClass?: 'suv' | 'sedan' | 'bus' | 'van' | 'coaster' | null;
  vehicleTotalSeats?: number | null;
};

export type AdminTripDetail = AdminTripSummary & {
  description: string | null;
  vehicleMode: string;
  paymentMethod: string;
  startingPrice: string | null;
  driver: AdminTripParticipant | null;
  winningPassenger: AdminTripParticipant | null;
  responses: AdminTripResponse[];
};

export type AdminTripResponse = {
  userId: string;
  fullName: string;
  phoneE164: string;
  role: 'passenger' | 'driver';
  avatarViewUrl?: string | null;
  amount: string | null;
  status: string;
  rank: number | null;
};

export type AdminHomeStats = {
  totalUsers: number;
  totalTrips: number;
  tripsByDrivers: number;
  tripsByPassengers: number;
  usersByDate: { date: string; count: number }[];
};

export type AdminCreditUser = {
  id: string;
  fullName: string;
  phoneE164: string;
  role: 'passenger' | 'driver';
  credits: number;
};

export type AdminCreditPurchaseSummary = {
  id: string;
  credits: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  proofViewUrl: string | null;
  user: {
    id: string;
    fullName: string;
    phoneE164: string;
    avatarViewUrl: string | null;
  };
};

export type AdminCreditPurchaseDetail = AdminCreditPurchaseSummary & {
  unitPrice: number;
  proofViewUrl: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  userCredits: number;
};

export type AdminSubzone = {
  id: string;
  name: string;
  cityId: string | null;
  cityLabel: string;
  latitude: number | null;
  longitude: number | null;
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

export type AdminBankAccount = {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
};

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

  listUsers(role: 'passenger' | 'driver', filter: AdminUserFilter, search?: string, page = 1) {
    return apiRequest<{ items: AdminUserSummary[]; total: number }>({
      method: 'GET',
      url: '/admin/users',
      params: {
        role,
        filter,
        page,
        limit: 50,
        ...(search?.trim() ? { q: search.trim() } : {}),
      },
    });
  },

  getUser(userId: string) {
    return apiRequest<AdminUserDetail>({ method: 'GET', url: `/admin/users/${userId}` });
  },

  reviewDocument(
    userId: string,
    input: {
      document: 'nic' | 'license';
      action: 'approve' | 'reject';
      reason?: string;
    },
  ) {
    return apiRequest<AdminUserDetail>({
      method: 'POST',
      url: `/admin/users/${userId}/documents/review`,
      data: input,
    });
  },

  listTrips(page = 1, search?: string) {
    return apiRequest<{ items: AdminTripSummary[]; total: number }>({
      method: 'GET',
      url: '/admin/trips',
      params: {
        page,
        limit: 50,
        ...(search?.trim() ? { q: search.trim() } : {}),
      },
    });
  },

  getTrip(tripId: string) {
    return apiRequest<AdminTripDetail>({ method: 'GET', url: `/admin/trips/${tripId}` });
  },

  getHomeStats() {
    return apiRequest<AdminHomeStats>({ method: 'GET', url: '/admin/home/stats' });
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

  getCreditSettings() {
    return apiRequest<{
      unitPrice: number;
      tripCreateCredits: number;
      bidOfferCredits: number;
    }>({
      method: 'GET',
      url: '/admin/credits/settings',
    });
  },

  updateCreditSettings(input: {
    unitPrice: number;
    tripCreateCredits: number;
    bidOfferCredits: number;
  }) {
    return apiRequest<{
      unitPrice: number;
      tripCreateCredits: number;
      bidOfferCredits: number;
    }>({
      method: 'PATCH',
      url: '/admin/credits/settings',
      data: input,
    });
  },

  getBankAccounts() {
    return apiRequest<{ accounts: AdminBankAccount[] }>({
      method: 'GET',
      url: '/admin/bank-accounts',
    });
  },

  updateBankAccounts(accounts: AdminBankAccount[]) {
    return apiRequest<{ accounts: AdminBankAccount[] }>({
      method: 'PATCH',
      url: '/admin/bank-accounts',
      data: { accounts },
    });
  },

  countPendingCreditPurchases() {
    return apiRequest<{ pendingCount: number }>({
      method: 'GET',
      url: '/admin/credits/purchases/pending-count',
    });
  },

  listCreditPurchases() {
    return apiRequest<{ items: AdminCreditPurchaseSummary[] }>({
      method: 'GET',
      url: '/admin/credits/purchases',
    });
  },

  getCreditPurchase(purchaseId: string) {
    return apiRequest<AdminCreditPurchaseDetail>({
      method: 'GET',
      url: `/admin/credits/purchases/${purchaseId}`,
    });
  },

  reviewCreditPurchase(
    purchaseId: string,
    action: 'approve' | 'reject',
    rejectionReason?: string,
  ) {
    return apiRequest<AdminCreditPurchaseDetail>({
      method: 'POST',
      url: `/admin/credits/purchases/${purchaseId}/review`,
      data: { action, ...(rejectionReason ? { rejectionReason } : {}) },
    });
  },

  listSubzones() {
    return apiRequest<{ items: AdminSubzone[] }>({ method: 'GET', url: '/admin/subzones' });
  },

  createSubzone(input: {
    name: string;
    cityLabel: string;
    cityId?: string | null;
    latitude: number;
    longitude: number;
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
      latitude: number;
      longitude: number;
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
