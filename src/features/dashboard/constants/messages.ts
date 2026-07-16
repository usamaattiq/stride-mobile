import { SHOW_DEMO_DASHBOARD_DATA } from './demo';
import type { HomeMessage } from '../types/messages.types';

/** Sample inbox rows — kept for when `SHOW_DEMO_DASHBOARD_DATA` is re-enabled. */
const DEMO_HOME_MESSAGES_DATA: HomeMessage[] = [
  {
    id: '1',
    senderName: 'Ali Raza',
    preview: 'Hi, is this seat still available for tomorrow?',
    timeLabel: '10:30 AM',
    unread: true,
    avatar: { initials: 'A', tone: 'purple' },
    context: {
      kind: 'request',
      title: 'Lahore → Islamabad',
      subtitle: 'Request ID: REQ-2458',
    },
  },
  {
    id: '2',
    senderName: 'Sara Ahmed',
    preview: 'Can you confirm the departure time?',
    timeLabel: 'Yesterday',
    unread: true,
    avatar: {
      initials: 'S',
      tone: 'green',
      imageUri: 'https://i.pravatar.cc/100?img=47',
    },
    context: {
      kind: 'request',
      title: 'Karachi → Multan',
      subtitle: 'Request ID: REQ-2459',
    },
  },
  {
    id: '3',
    senderName: 'Usman Khan',
    preview: 'Payment received. Looking forward to the trip!',
    timeLabel: '2d ago',
    unread: false,
    avatar: { initials: 'U', tone: 'green' },
    context: {
      kind: 'booking',
      title: 'Booking #BK-8847',
      subtitle: 'Listing ID: LST-1022',
    },
  },
  {
    id: '4',
    senderName: 'Fatima Noor',
    preview: 'Your listing has been approved and is now live.',
    timeLabel: '3d ago',
    unread: true,
    avatar: { initials: 'F', tone: 'pink' },
    context: {
      kind: 'listing',
      title: 'Listing #LST-3301',
      subtitle: 'Listing ID: LST-3301',
    },
  },
  {
    id: '5',
    senderName: 'Hassan Ali',
    preview: 'Thanks for the quick response!',
    timeLabel: '1w ago',
    unread: false,
    avatar: { initials: 'H', tone: 'blue' },
    context: {
      kind: 'request',
      title: 'Faisalabad → Peshawar',
      subtitle: 'Request ID: REQ-2460',
    },
  },
];

export const DEMO_HOME_MESSAGES: HomeMessage[] = SHOW_DEMO_DASHBOARD_DATA
  ? DEMO_HOME_MESSAGES_DATA
  : [];
