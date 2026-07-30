import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
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

type SuccessKind = 'verified' | 'skipped' | 'completed';

/**
 * Driving-license verification.
 * - purpose=become: enter driver mode (submit with docs, or skip without)
 * - purpose=complete: already a driver; only save license docs
 */
export function DriverVerificationScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const route = useRoute<RouteProp<SettingsStackParamList, 'DriverVerification'>>();
  const purpose = route.params?.purpose ?? 'become';
  const isCompleteFlow = purpose === 'complete';

  const { becomeDriver, switchToDriver, submitLicenseVerification } =
    useDashboardSession();

  const [licenseNumber, setLicenseNumber] = React.useState('');
  const [frontUri, setFrontUri] = React.useState<string | null>(null);
  const [backUri, setBackUri] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [successKind, setSuccessKind] = React.useState<SuccessKind | null>(null);

  const runAction = async (kind: SuccessKind, action: () => Promise<void>) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await action();
      setSuccessKind(kind);
    } catch (error) {
      const fallback =
        kind === 'skipped'
          ? t('driverVerification.skipFailed')
          : t('driverVerification.submitFailed');
      setSubmitError(getErrorMessage(error, fallback));
    } finally {
      setSubmitting(false);
    }
  };

  const uploadLicenseUrls = async () => {
    if (!frontUri || !backUri) {
      throw new Error('License images are required');
    }

    const licenseFrontUrl = isRemoteMediaUrl(frontUri)
      ? frontUri
      : (await uploadLocalFileToPresignedUrl(frontUri, { purpose: 'license_front' })).fileUrl;
    const licenseBackUrl = isRemoteMediaUrl(backUri)
      ? backUri
      : (await uploadLocalFileToPresignedUrl(backUri, { purpose: 'license_back' })).fileUrl;

    return { licenseFrontUrl, licenseBackUrl };
  };

  const handleSubmit = () => {
    if (!frontUri || !backUri) {
      return;
    }

    const submit = async () => {
      const { licenseFrontUrl, licenseBackUrl } = await uploadLicenseUrls();
      const input = {
        licenseNumber,
        licenseFrontUrl,
        licenseBackUrl,
      };

      if (isCompleteFlow) {
        await submitLicenseVerification(input);
        return;
      }

      await becomeDriver(input);
    };

    void runAction(isCompleteFlow ? 'completed' : 'verified', submit);
  };

  const handleSkip = () => {
    void runAction('skipped', () => switchToDriver());
  };

  const successMessage =
    successKind === 'skipped'
      ? t('driverVerification.skipSuccessBody')
      : successKind === 'completed'
        ? t('driverVerification.completeSuccessBody')
        : t('driverVerification.successBody');

  return (
    <>
      <AuthScaffold
        onBack={() => navigation.goBack()}
        title={t('driverVerification.title')}
        subtitle={
          isCompleteFlow
            ? t('driverVerification.completeSubtitle')
            : t('driverVerification.subtitle')
        }
        showLegalFooter={false}
        showLanguageSwitcher={false}
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
            submitLabel={
              isCompleteFlow
                ? t('driverVerification.completeCta')
                : t('driverVerification.cta')
            }
            skipLabel={isCompleteFlow ? undefined : t('driverVerification.skip')}
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
            onSubmit={handleSubmit}
            onSkip={isCompleteFlow ? undefined : handleSkip}
            keyboardType="default"
            loading={submitting}
            errorMessage={submitError}
          />
        </AuthCard>
      </AuthScaffold>

      <AppDialog
        visible={successKind !== null}
        icon="check"
        title={
          isCompleteFlow
            ? t('driverVerification.completeSuccessTitle')
            : t('driverVerification.successTitle')
        }
        message={successMessage}
        confirmAction={{
          label: t('common.ok'),
          onPress: () => {
            setSuccessKind(null);
            navigation.navigate('SettingsHome');
          },
        }}
      />
    </>
  );
}
