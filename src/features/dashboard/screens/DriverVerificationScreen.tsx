import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { IdentityDocumentVerification } from '@/shared/components/IdentityDocumentVerification';

import { useDashboardSession } from '../context/DashboardSessionContext';
import type { SettingsStackParamList } from '../navigation/settingsTypes';

/**
 * Become-a-driver license verification — same AuthScaffold shell as
 * signup personal verification (NIC), with driving-license copy.
 */
export function DriverVerificationScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { becomeDriver } = useDashboardSession();

  const [licenseNumber, setLicenseNumber] = React.useState('');
  const [frontUri, setFrontUri] = React.useState<string | null>(null);
  const [backUri, setBackUri] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [savedVisible, setSavedVisible] = React.useState(false);

  const handleSubmit = async () => {
    if (!frontUri || !backUri || submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await becomeDriver({
        licenseNumber,
        licenseFrontUrl: frontUri,
        licenseBackUrl: backUri,
      });
      setSavedVisible(true);
    } catch (error) {
      setSubmitError(getErrorMessage(error, t('driverVerification.submitFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AuthScaffold
        onBack={() => navigation.goBack()}
        title={t('driverVerification.title')}
        subtitle={t('driverVerification.subtitle')}
        showLegalFooter={false}
      >
        <AuthCard>
          <IdentityDocumentVerification
            documentNumber={licenseNumber}
            documentNumberLabel={t('driverVerification.licenseNumber')}
            documentNumberPlaceholder={t('driverVerification.licensePlaceholder')}
            frontUri={frontUri}
            backUri={backUri}
            frontLabel={t('driverVerification.licenseFront')}
            backLabel={t('driverVerification.licenseBack')}
            uploadHint={t('driverVerification.uploadHint')}
            changeHint={t('driverVerification.changeHint')}
            submitLabel={t('driverVerification.cta')}
            onChangeDocumentNumber={(value) => {
              setLicenseNumber(value);
              setSubmitError(null);
            }}
            onChangeFront={(uri) => {
              setFrontUri(uri);
              setSubmitError(null);
            }}
            onChangeBack={(uri) => {
              setBackUri(uri);
              setSubmitError(null);
            }}
            onSubmit={() => {
              void handleSubmit();
            }}
            keyboardType="default"
            loading={submitting}
            errorMessage={submitError}
          />
        </AuthCard>
      </AuthScaffold>

      <AppDialog
        visible={savedVisible}
        icon="check"
        title={t('driverVerification.successTitle')}
        message={t('driverVerification.successBody')}
        confirmAction={{
          label: t('common.ok'),
          onPress: () => {
            setSavedVisible(false);
            navigation.navigate('SettingsHome');
          },
        }}
      />
    </>
  );
}
