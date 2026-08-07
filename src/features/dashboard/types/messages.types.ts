export type MessageContextKind = 'rfq' | 'auction';

export type MessageAvatarTone = 'purple' | 'green' | 'pink' | 'blue';

export type HomeMessage = {
  id: string;
  tripId: string;
  listingType: 'rfq' | 'auction';
  offerId: string | null;
  counterpartyId: string;
  counterpartyRole: 'passenger' | 'driver' | null;
  senderName: string;
  preview: string;
  timeLabel: string;
  unread: boolean;
  avatar: {
    initials: string;
    tone: MessageAvatarTone;
    imageUri?: string;
  };
  context: {
    kind: MessageContextKind;
    title: string;
    subtitle: string;
  };
};

export type MessageFilter = 'all' | 'unread';
