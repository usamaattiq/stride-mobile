import { apiRequest } from './client';

export type RegisterDeviceTokenPayload = {
  token: string;
  platform: 'ios' | 'android';
  deviceId: string;
};

export const notificationsApi = {
  registerDeviceToken: (payload: RegisterDeviceTokenPayload): Promise<{ registered: true }> =>
    apiRequest({ method: 'POST', url: '/notifications/device-tokens', data: payload }),

  deleteDeviceToken: (token: string): Promise<{ deleted: true }> =>
    apiRequest({ method: 'DELETE', url: '/notifications/device-tokens', data: { token } }),

  sendTestPush: (): Promise<{ sentTo: number }> =>
    apiRequest({ method: 'POST', url: '/notifications/test' }),
};
