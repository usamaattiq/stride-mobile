import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { DocumentReviewStatusBanner } from '@/shared/components/DocumentReviewStatusBanner';
import { IdentityDocumentVerification } from '@/shared/components/IdentityDocumentVerification';
import {
  isRemoteMediaUrl,
  uploadLocalFileToPresignedUrl,
} from '@/shared/services/mediaUploadService';
import { useProfileStore } from '@/store/profileStore';

import { useDashboardSession } from '../context/DashboardSessionContext';
import type { SettingsStackParamList } from '../navigation/settingsTypes';

/**
 * Settings → NIC verification (also opened from the verify banner).
 * Same form as signup documents; persisted via PATCH /auth/me.
 * Drivers continue to license verification when license is still missing.
 */
export function NicVerificationScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { user, hasDriverVerification, submitNicVerification } =
    useDashboardSession();
  const profile = useProfileStore((state) => state.profile);

  const [nicNumber, setNicNumber] = React.useState(
    () => profile?.nicNumber?.trim() ?? '',
  );
  const [frontUri, setFrontUri] = React.useState<string | null>(
    () => profile?.nicFrontViewUrl ?? profile?.nicFrontUrl ?? null,
  );
  const [backUri, setBackUri] = React.useState<string | null>(
    () => profile?.nicBackViewUrl ?? profile?.nicBackUrl ?? null,
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [savedVisible, setSavedVisible] = React.useState(false);
  const continueToLicenseRef = React.useRef(false);
  const wasEditingRef = React.useRef(false);

  React.useEffect(() => {
    setNicNumber(profile?.nicNumber?.trim() ?? '');
    setFrontUri(profile?.nicFrontViewUrl ?? profile?.nicFrontUrl ?? null);
    setBackUri(profile?.nicBackViewUrl ?? profile?.nicBackUrl ?? null);
  }, [
    profile?.nicNumber,
    profile?.nicFrontUrl,
    profile?.nicFrontViewUrl,
    profile?.nicBackUrl,
    profile?.nicBackViewUrl,
  ]);

  const isEditingExisting = Boolean(
    (profile?.nicNumber?.trim() ?? '') &&
      (profile?.nicFrontViewUrl ?? profile?.nicFrontUrl) &&
      (profile?.nicBackViewUrl ?? profile?.nicBackUrl),
  );
  const nicStatus = profile?.nicStatus ?? 'not_submitted';
  const isReadOnly = nicStatus === 'pending' || nicStatus === 'approved';

  const handleSubmit = async () => {
    if (!frontUri || !backUri || submitting || isReadOnly) {
      return;
    }

    wasEditingRef.current = isEditingExisting;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Prefer stable fileUrl from the server profile when the UI is showing a signed view URL.
      const nicFrontUrl =
        frontUri === (profile?.nicFrontViewUrl ?? profile?.nicFrontUrl)
          ? (profile?.nicFrontUrl ?? frontUri)
          : isRemoteMediaUrl(frontUri)
            ? frontUri
            : (await uploadLocalFileToPresignedUrl(frontUri, { purpose: 'nic_front' })).fileUrl;
      const nicBackUrl =
        backUri === (profile?.nicBackViewUrl ?? profile?.nicBackUrl)
          ? (profile?.nicBackUrl ?? backUri)
          : isRemoteMediaUrl(backUri)
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
    navigation.goBack();
  };

  return (
    <>
      <AuthScaffold
        onBack={() => navigation.goBack()}
        title={t('nicVerification.title')}
        subtitle={t('nicVerification.subtitle')}
        showLegalFooter={false}
        showLanguageSwitcher={false}
      >
        <AuthCard>
          <DocumentReviewStatusBanner
            status={profile?.nicStatus ?? 'not_submitted'}
            rejectionReason={profile?.nicRejectionReason}
          />
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
            submitLabel={
              isEditingExisting
                ? t('nicVerification.saveCta')
                : t('nicVerification.cta')
            }
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
            readOnly={isReadOnly}
          />
        </AuthCard>
      </AuthScaffold>

      <AppDialog
        visible={savedVisible}
        icon="check"
        title={
          wasEditingRef.current
            ? t('nicVerification.savedTitle')
            : t('nicVerification.submittedTitle')
        }
        message={
          continueToLicenseRef.current
            ? t('nicVerification.successBodyContinueLicense')
            : wasEditingRef.current
              ? t('nicVerification.savedBody')
              : t('nicVerification.submittedBody')
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
