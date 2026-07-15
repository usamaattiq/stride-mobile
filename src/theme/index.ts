import { colors } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';
import {
  appFontAssets,
  fontFamilies,
  getFontFamily,
  typography,
} from './typography';

export { colors, radius, spacing, typography };
export { appFontAssets, fontFamilies, getFontFamily };
export type { FontWeightToken, Typography } from './typography';

export const theme = {
  colors,
  spacing,
  typography,
  radius,
} as const;
