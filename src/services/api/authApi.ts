import { apiRequest } from './client';
import type {
  AuthLoginResult,
  AuthSignupResult,
  BecomeDriverPayload,
  LoginOtpPurpose,
  PhoneIdentity,
  SignupSubmitPayload,
  UserProfileDto,
} from './authApi.types';

export const authApi = {
  sendSignupOtp: (phone: PhoneIdentity): Promise<{ sent: true }> =>
    apiRequest({ method: 'POST', url: '/auth/signup/otp/send', data: phone }),

  verifySignupOtp: (phone: PhoneIdentity, otp: string): Promise<{ verified: true }> =>
    apiRequest({ method: 'POST', url: '/auth/signup/otp/verify', data: { ...phone, otp } }),

  submitSignup: (payload: SignupSubmitPayload): Promise<AuthSignupResult> =>
    apiRequest({ method: 'POST', url: '/auth/signup/submit', data: payload }),

  checkSignupEmail: (email: string): Promise<{ available: boolean }> =>
    apiRequest({ method: 'POST', url: '/auth/signup/email/check', data: { email } }),

  sendLoginOtp: (phone: PhoneIdentity, purpose: LoginOtpPurpose = 'login'): Promise<{ sent: true }> =>
    apiRequest({ method: 'POST', url: '/auth/login/otp/send', data: { ...phone, purpose } }),

  verifyLoginOtp: (
    phone: PhoneIdentity,
    otp: string,
    purpose: LoginOtpPurpose = 'login',
  ): Promise<{ verified: true }> =>
    apiRequest({ method: 'POST', url: '/auth/login/otp/verify', data: { ...phone, otp, purpose } }),

  loginWithMpin: (phone: PhoneIdentity, mpin: string, deviceId: string): Promise<AuthLoginResult> =>
    apiRequest({ method: 'POST', url: '/auth/login/mpin', data: { ...phone, mpin, deviceId } }),

  resetMpin: (phone: PhoneIdentity, newMpin: string, deviceId: string): Promise<AuthLoginResult> =>
    apiRequest({ method: 'POST', url: '/auth/login/mpin/reset', data: { ...phone, newMpin, deviceId } }),

  getMe: (): Promise<UserProfileDto> => apiRequest({ method: 'GET', url: '/auth/me' }),

  updateMe: (payload: Partial<UserProfileDto>): Promise<UserProfileDto> =>
    apiRequest({ method: 'PATCH', url: '/auth/me', data: payload }),

  becomeDriver: (payload: BecomeDriverPayload): Promise<AuthLoginResult> =>
    apiRequest({ method: 'POST', url: '/auth/become-driver', data: payload }),

  switchToDriver: (deviceId: string): Promise<AuthLoginResult> =>
    apiRequest({ method: 'POST', url: '/auth/switch-to-driver', data: { deviceId } }),

  switchToPassenger: (deviceId: string): Promise<AuthLoginResult> =>
    apiRequest({ method: 'POST', url: '/auth/switch-to-passenger', data: { deviceId } }),

  changeMpin: (currentMpin: string, newMpin: string): Promise<{ updated: true }> =>
    apiRequest({ method: 'PATCH', url: '/auth/mpin', data: { currentMpin, newMpin } }),

  logout: (): Promise<{ loggedOut: true }> => apiRequest({ method: 'POST', url: '/auth/logout' }),
};
