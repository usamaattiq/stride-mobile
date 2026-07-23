import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

import { ENV } from '@/shared/config/env';
import { authStore } from '@/store/authStore';
import { sessionRevokedHandler } from '@/services/sessionRevokedHandler';
import { ApiError, isSessionRevokedError } from './apiError';

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

export const apiClient = axios.create({
  baseURL: ENV.apiBaseUrl,
  timeout: 20_000,
});

apiClient.interceptors.request.use((config) => {
  const token = authStore.getToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiEnvelope<unknown>;
    if (envelope?.success) {
      // Intentionally unwrapped: callers go through `apiRequest<T>`, which asserts the
      // envelope's `data` payload as T instead of the raw AxiosResponse.
      return envelope.data as unknown as typeof response;
    }
    return Promise.reject(
      new ApiError(response.status, 'UNKNOWN_ERROR', 'Unexpected response from server'),
    );
  },
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const body = error.response?.data;

    const apiError =
      body && body.success === false
        ? new ApiError(error.response!.status, body.error.code, body.error.message, body.error.details)
        : new ApiError(
            error.response?.status ?? 0,
            'NETWORK_ERROR',
            error.message || 'Unable to reach the server',
          );

    if (isSessionRevokedError(apiError)) {
      void sessionRevokedHandler.handle();
    }

    return Promise.reject(apiError);
  },
);

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response as unknown as T;
}
