import { SHOW_DEMO_DASHBOARD_DATA } from './demo';
import type { AppNotification } from '../types/notifications.types';

const DEMO_NOTIFICATIONS_DATA: AppNotification[] = [
  {
    id: '1',
    title: 'New offer received',
    body: 'Ali Raza placed an offer on Lahore → Islamabad.',
    timeLabel: '10 min ago',
    unread: true,
    kind: 'offer',
  },
  {
    id: '2',
    title: 'Booking confirmed',
    body: 'Booking #BK-8847 has been confirmed by the passenger.',
    timeLabel: '1h ago',
    unread: true,
    kind: 'booking',
  },
  {
    id: '3',
    title: 'Listing approved',
    body: 'Your listing #LST-3301 is now live for passengers.',
    timeLabel: 'Yesterday',
    unread: true,
    kind: 'system',
  },
  {
    id: '4',
    title: 'Offer expired',
    body: 'Your offer on Karachi → Multan has expired.',
    timeLabel: '2d ago',
    unread: false,
    kind: 'offer',
  },
];

export const DEMO_NOTIFICATIONS: AppNotification[] = SHOW_DEMO_DASHBOARD_DATA
  ? DEMO_NOTIFICATIONS_DATA
  : [];
