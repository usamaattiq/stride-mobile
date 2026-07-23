import { apiRequest } from './client';
import type {
  AuthenticatedPresignPayload,
  PresignUploadResult,
  SignupPresignPayload,
} from './uploadApi.types';

export const uploadApi = {
  presign: (payload: AuthenticatedPresignPayload): Promise<PresignUploadResult> =>
    apiRequest({ method: 'POST', url: '/uploads/presign', data: payload }),

  presignSignup: (payload: SignupPresignPayload): Promise<PresignUploadResult> =>
    apiRequest({ method: 'POST', url: '/auth/signup/uploads/presign', data: payload }),
};
