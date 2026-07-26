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
import {
  isRemoteMediaUrl,
  uploadLocalFileToPresignedUrl,
} from '@/shared/services/mediaUploadService';

import { useDashboardSession } from '../context/DashboardSessionContext';
import type { SettingsStackParamList } from '../navigation/settingsTypes';

/**
 * Post-signup NIC verification — same form as signup documents,
 * persisted via PATCH /auth/me.
 * Drivers continue to license verification when license is still missing.
 */
export function NicVerificationScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { user, hasDriverVerification, submitNicVerification } =
    useDashboardSession();

  const [nicNumber, setNicNumber] = React.useState('');
  const [frontUri, setFrontUri] = React.useState<string | null>(null);
  const [backUri, setBackUri] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [savedVisible, setSavedVisible] = React.useState(false);
  const continueToLicenseRef = React.useRef(false);

  const handleSubmit = async () => {
    if (!frontUri || !backUri || submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const nicFrontUrl = isRemoteMediaUrl(frontUri)
        ? frontUri
        : (await uploadLocalFileToPresignedUrl(frontUri, { purpose: 'nic_front' })).fileUrl;
      const nicBackUrl = isRemoteMediaUrl(backUri)
        ? backUri
        : (await uploadLocalFileToPresignedUrl(backUri, { purpose: 'nic_back' })).fileUrl;

      await submitNicVerification({
        nicNumber,
        nicFrontUrl,
        nicBackUrl,
      });
      continueToLicenseRef.current =
        user.role === 'driver' && !hasDriverVerification;
      setSavedVisible(true);
    } catch (error) {
      setSubmitError(getErrorMessage(error, t('nicVerification.submitFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessConfirm = () => {
    setSavedVisible(false);
    if (continueToLicenseRef.current) {
      navigation.replace('DriverVerification', { purpose: 'complete' });
      return;
    }
    navigation.navigate('SettingsHome');
  };

  return (
    <>
      <AuthScaffold
        onBack={() => navigation.goBack()}
        title={t('nicVerification.title')}
        subtitle={t('nicVerification.subtitle')}
        showLegalFooter={false}
      >
        <AuthCard>
          <IdentityDocumentVerification
            documentNumber={nicNumber}
            documentNumberLabel={t('nicVerification.nicNumber')}
            documentNumberPlaceholder={t('nicVerification.nicPlaceholder')}
            frontUri={frontUri}
            backUri={backUri}
            frontLabel={t('nicVerification.nicFront')}
            backLabel={t('nicVerification.nicBack')}
            uploadHint={t('nicVerification.uploadHint')}
            changeHint={t('nicVerification.changeHint')}
            submitLabel={t('nicVerification.cta')}
            onChangeDocumentNumber={(value) => {
              setNicNumber(value);
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
            loading={submitting}
            errorMessage={submitError}
          />
        </AuthCard>
      </AuthScaffold>

      <AppDialog
        visible={savedVisible}
        icon="check"
        title={t('nicVerification.successTitle')}
        message={
          continueToLicenseRef.current
            ? t('nicVerification.successBodyContinueLicense')
            : t('nicVerification.successBody')
        }
        confirmAction={{
          label: continueToLicenseRef.current
            ? t('nicVerification.continueLicenseCta')
            : t('common.ok'),
          onPress: handleSuccessConfirm,
        }}
      />
    </>
  );
}
