export type ChatMessageDeliveryStatus = 'sent' | 'delivered' | 'read';

export type TripConversation = {
  id: string;
  tripId: string;
  listingType: 'rfq' | 'auction';
  offerId: string | null;
  ownerUserId: string;
  participantUserId: string;
  counterpartyId: string;
  counterpartyName: string | null;
  createdAt: string;
};

export type TripChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  status: ChatMessageDeliveryStatus;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
};

export type TripConversationInboxItem = {
  id: string;
  tripId: string;
  listingType: 'rfq' | 'auction';
  offerId: string | null;
  counterpartyId: string;
  counterpartyName: string | null;
  counterpartyAvatarUrl: string | null;
  departureCityLabel: string;
  arrivalCityLabel: string;
  lastMessage: {
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
  } | null;
  unread: boolean;
  updatedAt: string;
};

export type OpenConversationPayload = {
  /** Required when the listing owner opens chat. */
  counterpartyId?: string;
  /** Required for RFQ threads. */
  offerId?: string;
};
