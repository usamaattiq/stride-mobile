import { apiRequest } from './client';
import { authStore } from '@/store/authStore';
import { useSignupDraftStore } from '@/store/signupDraftStore';

export type ResolvedLocationDto = {
  address: string;
  town?: string;
  city: string;
  country: string;
  placeId?: string | null;
  latitude: number;
  longitude: number;
};

export type PlacePredictionDto = {
  placeId: string;
  description: string;
};

export type MapSearchResultDto = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

export type DirectionsDto = {
  points: Array<{ latitude: number; longitude: number }>;
  distanceMeters: number;
  durationSeconds: number;
};

export function createPlacesSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Prefer live session (Bearer via interceptor). During signup after OTP, pass
 * countryCallingCode + phoneDigits (same gate as signup uploads).
 */
function locationAuthQuery(): Record<string, string> | null {
  if (authStore.getToken()) {
    return {};
  }

  const { draft } = useSignupDraftStore.getState();
  const phoneDigits = draft.phoneDigits?.trim() ?? '';
  const countryCallingCode = draft.country?.callingCode?.trim() ?? '';
  if (!phoneDigits || !countryCallingCode) {
    return null;
  }

  return { countryCallingCode, phoneDigits };
}

function withAuthParams(params: Record<string, string | number | undefined>): Record<string, string | number> | null {
  const auth = locationAuthQuery();
  if (auth == null) {
    return null;
  }

  const out: Record<string, string | number> = { ...auth };
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    out[key] = value;
  }
  return out;
}

export const locationsApi = {
  autocomplete: async (input: {
    input: string;
    sessiontoken: string;
    types?: string;
    language?: string;
  }): Promise<PlacePredictionDto[]> => {
    const params = withAuthParams(input);
    if (!params) return [];
    try {
      const rows = await apiRequest<PlacePredictionDto[]>({
        method: 'GET',
        url: '/locations/autocomplete',
        params,
      });
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  },

  details: async (input: {
    placeId: string;
    sessiontoken: string;
    language?: string;
  }): Promise<ResolvedLocationDto | null> => {
    const params = withAuthParams(input);
    if (!params) return null;
    try {
      return await apiRequest<ResolvedLocationDto | null>({
        method: 'GET',
        url: '/locations/details',
        params,
      });
    } catch {
      return null;
    }
  },

  reverseGeocode: async (input: {
    lat: number;
    lng: number;
    language?: string;
  }): Promise<ResolvedLocationDto | null> => {
    const params = withAuthParams(input);
    if (!params) return null;
    try {
      return await apiRequest<ResolvedLocationDto | null>({
        method: 'GET',
        url: '/locations/reverse-geocode',
        params,
      });
    } catch {
      return null;
    }
  },

  geocode: async (input: {
    address?: string;
    placeId?: string;
    language?: string;
  }): Promise<ResolvedLocationDto | null> => {
    const params = withAuthParams(input);
    if (!params) return null;
    try {
      return await apiRequest<ResolvedLocationDto | null>({
        method: 'GET',
        url: '/locations/geocode',
        params,
      });
    } catch {
      return null;
    }
  },

  search: async (input: {
    q: string;
    language?: string;
  }): Promise<MapSearchResultDto[]> => {
    const params = withAuthParams(input);
    if (!params) return [];
    try {
      const rows = await apiRequest<MapSearchResultDto[]>({
        method: 'GET',
        url: '/locations/search',
        params,
      });
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  },

  directions: async (input: {
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
  }): Promise<DirectionsDto | null> => {
    const params = withAuthParams(input);
    if (!params) return null;
    try {
      return await apiRequest<DirectionsDto | null>({
        method: 'GET',
        url: '/locations/directions',
        params,
      });
    } catch {
      return null;
    }
  },
};
