export const colors = {
  primary: '#B42318',
  primaryPressed: '#912018',
  primaryMuted: 'rgba(180, 35, 24, 0.12)',
  primaryDisabled: '#E7A9A4',
  primarySoft: '#FEE4E2',

  white: '#FFFFFF',
  black: '#0A0A0A',

  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    inverseMuted: 'rgba(255, 255, 255, 0.85)',
    onImageMuted: 'rgba(255, 255, 255, 0.45)',
    onBrandMuted: '#F9D2CF',
  },

  background: {
    canvas: '#FFFFFF',
    subtle: '#F9FAFB',
  },

  border: {
    default: '#E5E7EB',
    strong: '#D1D5DB',
  },

  overlay: {
    heroTop: 'transparent',
    heroMid: 'rgba(0, 0, 0, 0.15)',
    heroBottom: 'rgba(0, 0, 0, 0.72)',
  },

  accent: {
    credits: '#E4572E',
    coins: '#E8A13A',
    unread: '#B42318',
    read: '#D1D5DB',
    purple: {
      soft: '#F3E8FF',
      text: '#7C3AED',
      avatar: '#8B5CF6',
    },
    blue: {
      soft: '#DBEAFE',
      text: '#2563EB',
      avatar: '#3B82F6',
    },
    green: {
      soft: '#D1FAE5',
      text: '#059669',
      avatar: '#10B981',
    },
    amber: {
      soft: '#FED7AA',
      text: '#EA580C',
      avatar: '#F97316',
    },
    pink: {
      soft: '#FCE7F3',
      text: '#DB2777',
      avatar: '#EC4899',
    },
  },
} as const;

export type Colors = typeof colors;
