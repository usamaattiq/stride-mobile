import { apiRequest } from './client';

export type InboxNotificationDto = {
  id: string;
  title: string;
  body: string;
  deepLink: string;
  data: Record<string, unknown> | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  readAt: string | null;
};

export type InboxListResult = {
  items: InboxNotificationDto[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
};

export const notificationsApi = {
  registerDeviceToken: (input: {
    token: string;
    platform: 'ios' | 'android';
    deviceId: string;
  }): Promise<{ registered: boolean }> =>
    apiRequest({
      method: 'POST',
      url: '/notifications/device-tokens',
      data: input,
    }),

  unregisterDeviceToken: (token: string): Promise<{ deleted: boolean }> =>
    apiRequest({
      method: 'DELETE',
      url: '/notifications/device-tokens',
      data: { token },
    }),

  listInbox: (query?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<InboxListResult> =>
    apiRequest({
      method: 'GET',
      url: '/notifications/inbox',
      params: query,
    }),

  markRead: (notificationId: string): Promise<InboxNotificationDto> =>
    apiRequest({
      method: 'PATCH',
      url: '/notifications/inbox/read',
      data: { notificationId },
    }),
};
