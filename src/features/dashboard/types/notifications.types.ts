export type AppNotification = {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
  unread: boolean;
  kind: 'offer' | 'booking' | 'system';
};
