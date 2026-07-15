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
} as const;

export type Colors = typeof colors;
