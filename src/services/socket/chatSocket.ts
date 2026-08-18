import { io, type Socket } from 'socket.io-client';

import type { TripChatMessage } from '@/services/api/chatApi.types';
import { ENV } from '@/shared/config/env';
import { authStore } from '@/store/authStore';

export type ChatStatusPayload = {
  conversationId: string;
  messages: TripChatMessage[];
};

/** Strip trailing `/api` so the socket hits the HTTP server root. */
function socketBaseUrl(): string {
  return ENV.apiBaseUrl.replace(/\/api\/?$/, '');
}

let socket: Socket | null = null;
let joinedConversationId: string | null = null;

function getSocket(): Socket {
  if (socket) {
    return socket;
  }

  socket = io(socketBaseUrl(), {
    path: '/socket.io',
    // Prefer websocket; fall back to long-polling if the proxy blocks Upgrade.
    transports: ['websocket', 'polling'],
    upgrade: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 8,
  });

  socket.on('reconnect', () => {
    if (!joinedConversationId) {
      return;
    }
    // Room membership is lost on reconnect — re-join quietly.
    const tripId = pendingRejoinTripId;
    if (!tripId) {
      return;
    }
    socket?.emit('chat:join', {
      tripId,
      conversationId: joinedConversationId,
    });
  });

  return socket;
}

let pendingRejoinTripId: string | null = null;

function ensureConnected(): Promise<Socket> {
  const active = getSocket();
  active.auth = { token: authStore.getToken() ?? '' };

  if (active.connected) {
    return Promise.resolve(active);
  }

  return new Promise((resolve, reject) => {
    const timeoutMs = 12_000;
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Chat socket timed out'));
    }, timeoutMs);

    const onConnect = () => {
      cleanup();
      resolve(active);
    };
    const onError = (err: Error) => {
      // First transport (websocket) often fails behind nginx without Upgrade;
      // wait for polling / reconnect instead of treating that as fatal.
      if (active.active) {
        return;
      }
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      clearTimeout(timer);
      active.off('connect', onConnect);
      active.off('connect_error', onError);
    };

    active.on('connect', onConnect);
    active.on('connect_error', onError);
    active.connect();
  });
}

export const chatSocket = {
  async joinConversation(
    tripId: string,
    conversationId: string,
  ): Promise<{ ok: boolean; error?: string }> {
    pendingRejoinTripId = tripId;
    joinedConversationId = conversationId;
    const active = await ensureConnected();
    return new Promise((resolve) => {
      active.emit(
        'chat:join',
        { tripId, conversationId },
        (result: { ok: boolean; error?: string }) => {
          resolve(result ?? { ok: false, error: 'No response' });
        },
      );
    });
  },

  leaveConversation(conversationId: string): void {
    if (joinedConversationId === conversationId) {
      joinedConversationId = null;
      pendingRejoinTripId = null;
    }
    socket?.emit('chat:leave', { conversationId });
  },

  onMessage(handler: (message: TripChatMessage) => void): () => void {
    const active = getSocket();
    active.on('chat:message', handler);
    return () => {
      active.off('chat:message', handler);
    };
  },

  onStatus(handler: (payload: ChatStatusPayload) => void): () => void {
    const active = getSocket();
    active.on('chat:status', handler);
    return () => {
      active.off('chat:status', handler);
    };
  },

  disconnect(): void {
    joinedConversationId = null;
    pendingRejoinTripId = null;
    if (!socket) {
      return;
    }
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  },
};
