import React from 'react';
import {
  Linking,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppText } from '@/shared/components/AppText';
import { complianceDocUrl } from '@/shared/config/compliance';
import {
  useLegalDocumentSheets,
  type LegalDocumentSheetControl,
} from '@/shared/hooks/useLegalDocumentSheets';
import { colors, spacing, typography } from '@/theme';

type LegalLinksProps = {
  /** Share one sheet instance when the parent also opens legal docs elsewhere. */
  legalControl?: LegalDocumentSheetControl;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
};

async function openComplianceOrSheet(
  slug: 'terms-and-conditions' | 'privacy-policy',
  locale: 'en' | 'ar',
  openSheet: () => void,
): Promise<void> {
  const url = complianceDocUrl(slug, locale);
  if (!url) {
    openSheet();
    return;
  }
  try {
    await Linking.openURL(url);
  } catch {
    openSheet();
  }
}

/**
 * Terms & Conditions | Privacy Policy — opens hosted stride-compliance when
 * `EXPO_PUBLIC_COMPLIANCE_BASE_URL` is set; otherwise falls back to bottom sheets.
 */
export function LegalLinks({
  legalControl,
  onTermsPress,
  onPrivacyPress,
  containerStyle,
}: LegalLinksProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { isRTL, currentLanguage } = useLanguage();
  const locale = currentLanguage === 'ar' ? 'ar' : 'en';
  const internalLegal = useLegalDocumentSheets();
  const { openTerms, openPrivacy, legalSheets } = legalControl ?? internalLegal;

  const handleTerms = (): void => {
    if (onTermsPress) {
      onTermsPress();
      return;
    }
    void openComplianceOrSheet('terms-and-conditions', locale, openTerms);
  };

  const handlePrivacy = (): void => {
    if (onPrivacyPress) {
      onPrivacyPress();
      return;
    }
    void openComplianceOrSheet('privacy-policy', locale, openPrivacy);
  };

  return (
    <>
      <View style={[styles.container, containerStyle]}>
        <AppText
          weight="regular"
          style={[styles.legal, isRTL && styles.legalRtl]}
          maxFontSizeMultiplier={1.3}
        >
          <AppText
            weight="regular"
            accessibilityRole="link"
            accessibilityLabel={t('auth.welcome.terms')}
            onPress={handleTerms}
            style={styles.legalLink}
          >
            {t('auth.welcome.terms')}
          </AppText>
          {'  |  '}
          <AppText
            weight="regular"
            accessibilityRole="link"
            accessibilityLabel={t('auth.welcome.privacy')}
            onPress={handlePrivacy}
            style={styles.legalLink}
          >
            {t('auth.welcome.privacy')}
          </AppText>
        </AppText>
      </View>
      {legalControl ? null : legalSheets}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  legal: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 16,
    color: colors.primary,
    textAlign: 'center',
  },
  legalRtl: {
    writingDirection: 'rtl',
  },
  legalLink: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primary,
  },
});
