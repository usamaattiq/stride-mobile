import { apiRequest } from './client';
import type {
  OpenConversationPayload,
  TripChatMessage,
  TripConversation,
  TripConversationInboxItem,
} from './chatApi.types';

export const chatApi = {
  listInbox: (): Promise<TripConversationInboxItem[]> =>
    apiRequest({ method: 'GET', url: '/trips/conversations' }),

  openConversation: (tripId: string, payload: OpenConversationPayload): Promise<TripConversation> =>
    apiRequest({ method: 'POST', url: `/trips/${tripId}/conversations`, data: payload }),

  listMessages: (
    tripId: string,
    conversationId: string,
    params?: { after?: string; limit?: number },
  ): Promise<TripChatMessage[]> =>
    apiRequest({
      method: 'GET',
      url: `/trips/${tripId}/conversations/${conversationId}/messages`,
      params,
    }),

  sendMessage: (
    tripId: string,
    conversationId: string,
    body: string,
  ): Promise<TripChatMessage> =>
    apiRequest({
      method: 'POST',
      url: `/trips/${tripId}/conversations/${conversationId}/messages`,
      data: { body },
    }),

  markRead: (tripId: string, conversationId: string): Promise<{ updated: number }> =>
    apiRequest({
      method: 'POST',
      url: `/trips/${tripId}/conversations/${conversationId}/read`,
    }),
};
