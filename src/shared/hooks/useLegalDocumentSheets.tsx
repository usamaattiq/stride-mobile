import React from 'react';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import {
  LEGAL_PRIVACY_SECTION_KEYS,
  LEGAL_TERMS_SECTION_KEYS,
} from '@/i18n/constants/legal-section-keys';
import {
  LegalDocumentBottomSheet,
  type LegalDocumentSection,
} from '@/shared/components/legal/LegalDocumentBottomSheet';

export type LegalDocumentSheetControl = {
  openTerms: () => void;
  openPrivacy: () => void;
  legalSheets: React.ReactElement;
};

type LegalSheetKind = 'terms' | 'privacy' | null;

type TFunction = (key: string) => string;

function readSections(
  t: TFunction,
  kind: 'terms' | 'privacy',
  sectionKeys: readonly string[],
): LegalDocumentSection[] {
  return sectionKeys.map((sectionKey) => ({
    title: t(`legal.${kind}.sections.${sectionKey}.title`),
    body: t(`legal.${kind}.sections.${sectionKey}.body`),
  }));
}

export function useLegalDocumentSheets(): LegalDocumentSheetControl {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [activeSheet, setActiveSheet] = React.useState<LegalSheetKind>(null);

  const termsSections = React.useMemo(
    () => readSections(t, 'terms', LEGAL_TERMS_SECTION_KEYS),
    [t],
  );
  const privacySections = React.useMemo(
    () => readSections(t, 'privacy', LEGAL_PRIVACY_SECTION_KEYS),
    [t],
  );

  const legalSheets = (
    <>
      <LegalDocumentBottomSheet
        visible={activeSheet === 'terms'}
        title={t('legal.terms.title')}
        lastUpdated={t('legal.common.lastUpdated')}
        intro={t('legal.terms.intro')}
        sections={termsSections}
        closeLabel={t('legal.common.close')}
        onClose={() => setActiveSheet(null)}
        heightRatio={0.85}
      />
      <LegalDocumentBottomSheet
        visible={activeSheet === 'privacy'}
        title={t('legal.privacy.title')}
        lastUpdated={t('legal.common.lastUpdated')}
        intro={t('legal.privacy.intro')}
        sections={privacySections}
        closeLabel={t('legal.common.close')}
        onClose={() => setActiveSheet(null)}
        heightRatio={0.85}
      />
    </>
  );

  return {
    openTerms: () => setActiveSheet('terms'),
    openPrivacy: () => setActiveSheet('privacy'),
    legalSheets,
  };
}
