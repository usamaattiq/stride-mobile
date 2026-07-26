export type MessageContextKind = 'request' | 'booking' | 'listing';

export type MessageAvatarTone = 'purple' | 'green' | 'pink' | 'blue';

export type HomeMessage = {
  id: string;
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
