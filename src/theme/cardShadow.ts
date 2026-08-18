import { Platform, type ViewStyle } from 'react-native';

/** Soft all-around grey drop shadow for listing / offer cards. */
export const cardBackShadow: ViewStyle = {
  ...Platform.select({
    ios: {
      shadowColor: '#111827',
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  boxShadow: '0px 0px 10px rgba(17, 24, 39, 0.12)',
};
