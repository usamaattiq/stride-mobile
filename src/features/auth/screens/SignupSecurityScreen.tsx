import React from 'react';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { SecuritySetupForm } from '@/shared/components/SecuritySetupForm';

type SignupSecurityScreenProps = {
  mpin: string;
  mpinConfirm: string;
  biometricEnabled: boolean;
  onChangeMpin: (value: string) => void;
  onChangeMpinConfirm: (value: string) => void;
  onChangeBiometric: (enabled: boolean) => void;
  onContinue: () => void;
  submitting?: boolean;
  errorMessage?: string | null;
};

/** Signup security step — shared form; heading lives on AuthScaffold. */
export function SignupSecurityScreen({
  mpin,
  mpinConfirm,
  biometricEnabled,
  onChangeMpin,
  onChangeMpinConfirm,
  onChangeBiometric,
  onContinue,
  submitting,
  errorMessage,
}: SignupSecurityScreenProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <SecuritySetupForm
      mode="setup"
      mpin={mpin}
      mpinConfirm={mpinConfirm}
      biometricEnabled={biometricEnabled}
      onChangeMpin={onChangeMpin}
      onChangeMpinConfirm={onChangeMpinConfirm}
      onChangeBiometric={onChangeBiometric}
      onSubmit={onContinue}
      submitLabel={t('auth.signup.security.cta')}
      submitting={submitting}
      errorMessage={errorMessage}
    />
  );
}
