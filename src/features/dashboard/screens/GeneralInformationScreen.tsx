import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { isApiErrorWithCode } from '@/services/api/apiError';
import { authApi } from '@/services/api/authApi';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { PersonalInformationForm } from '@/shared/components/PersonalInformationForm';
import { isValidEmail } from '@/shared/utils/email-validation';

import { useDashboardSession } from '../context/DashboardSessionContext';
import type { SettingsStackParamList } from '../navigation/settingsTypes';

/**
 * Settings → General information.
 * Same shared personal-info form as signup; only AuthScaffold heading + CTA differ.
 */
export function GeneralInformationScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { user, updateProfile } = useDashboardSession();

  const [fullName, setFullName] = React.useState(user.fullName);
  const [email, setEmail] = React.useState(user.email);
  const [address, setAddress] = React.useState(user.address);
  const [profilePhotoUri, setProfilePhotoUri] = React.useState<string | null>(
    user.avatarUri ?? null,
  );
  const [locationCoords, setLocationCoords] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(
    user.latitude != null && user.longitude != null
      ? { latitude: user.latitude, longitude: user.longitude }
      : null,
  );
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [emailTakenError, setEmailTakenError] = React.useState<string | null>(null);
  const [savedVisible, setSavedVisible] = React.useState(false);

  React.useEffect(() => {
    setFullName(user.fullName);
    setEmail(user.email);
    setAddress(user.address);
    setProfilePhotoUri(user.avatarUri ?? null);
    setLocationCoords(
      user.latitude != null && user.longitude != null
        ? { latitude: user.latitude, longitude: user.longitude }
        : null,
    );
  }, [user.fullName, user.email, user.address, user.avatarUri, user.latitude, user.longitude]);

  React.useEffect(() => {
    const trimmed = email.trim();
    const current = user.email.trim().toLowerCase();
    if (!trimmed || trimmed.toLowerCase() === current || !isValidEmail(trimmed)) {
      setEmailTakenError(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void authApi
        .checkSignupEmail(trimmed)
        .then(({ available }) => {
          if (!cancelled) {
            setEmailTakenError(available ? null : t('auth.signup.personal.emailTaken'));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setEmailTakenError(null);
          }
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [email, user.email, t]);

  const isDirty =
    fullName.trim() !== user.fullName ||
    email.trim() !== user.email ||
    address.trim() !== user.address ||
    (profilePhotoUri ?? null) !== (user.avatarUri ?? null);

  const handleSave = async () => {
    if (saving || !isDirty || emailTakenError) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await updateProfile({
        fullName,
        email,
        address,
        avatarUri: profilePhotoUri,
        locationCoordinates: locationCoords,
      });
      setSavedVisible(true);
    } catch (error) {
      if (isApiErrorWithCode(error, 'CONFLICT')) {
        setEmailTakenError(t('auth.signup.personal.emailTaken'));
      } else {
        setSaveError(getErrorMessage(error, t('generalInformation.saveFailed')));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AuthScaffold
        onBack={() => navigation.goBack()}
        title={t('generalInformation.title')}
        subtitle={t('generalInformation.subtitle')}
        showLegalFooter={false}
        showLanguageSwitcher={false}
      >
        <PersonalInformationForm
          fullName={fullName}
          email={email}
          address={address}
          mobileNumber={user.mobileNumber}
          profilePhotoUri={profilePhotoUri}
          locationCoords={locationCoords}
          onChangeFullName={(value) => {
            setFullName(value);
            setSaveError(null);
          }}
          onChangeEmail={(value) => {
            setEmail(value);
            setSaveError(null);
            setEmailTakenError(null);
          }}
          onChangeAddress={(value) => {
            setAddress(value);
            setSaveError(null);
          }}
          onChangeLocationCoords={setLocationCoords}
          onChangePhoto={(uri) => {
            setProfilePhotoUri(uri);
            setSaveError(null);
          }}
          onSubmit={() => {
            void handleSave();
          }}
          submitLabel={t('generalInformation.saveCta')}
          showMobileLockedHint
          allowRemovePhoto
          emailTakenError={emailTakenError}
          submitDisabled={!isDirty || saving || Boolean(emailTakenError)}
          loading={saving}
          errorMessage={saveError}
        />
      </AuthScaffold>

      <AppDialog
        visible={savedVisible}
        icon="check"
        title={t('generalInformation.savedTitle')}
        message={t('generalInformation.savedBody')}
        confirmAction={{
          label: t('common.ok'),
          onPress: () => {
            setSavedVisible(false);
            navigation.goBack();
          },
        }}
      />
    </>
  );
}
