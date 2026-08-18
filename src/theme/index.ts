import { colors } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';
import {
  appFontAssets,
  fontFamilies,
  getFontFamily,
  getInputFontFamily,
  iosArabicOpticalAlignStyle,
  isNumericKeyboardType,
  typography,
} from './typography';

export { colors, radius, spacing, typography };
export { cardBackShadow } from './cardShadow';
export {
  appFontAssets,
  fontFamilies,
  getFontFamily,
  getInputFontFamily,
  iosArabicOpticalAlignStyle,
  isNumericKeyboardType,
};
export type { FontWeightToken, Typography } from './typography';

export const theme = {
  colors,
  spacing,
  typography,
  radius,
} as const;
