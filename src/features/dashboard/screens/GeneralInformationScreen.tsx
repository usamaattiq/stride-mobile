import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { AppDialog } from '@/shared/components/AppDialog';
import { PersonalInformationForm } from '@/shared/components/PersonalInformationForm';

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
  } | null>(null);
  const [savedVisible, setSavedVisible] = React.useState(false);

  React.useEffect(() => {
    setFullName(user.fullName);
    setEmail(user.email);
    setAddress(user.address);
    setProfilePhotoUri(user.avatarUri ?? null);
  }, [user.fullName, user.email, user.address, user.avatarUri]);

  const isDirty =
    fullName.trim() !== user.fullName ||
    email.trim() !== user.email ||
    address.trim() !== user.address ||
    (profilePhotoUri ?? null) !== (user.avatarUri ?? null);

  const handleSave = () => {
    updateProfile({
      fullName,
      email,
      address,
      avatarUri: profilePhotoUri ?? undefined,
    });
    setSavedVisible(true);
  };

  return (
    <>
      <AuthScaffold
        onBack={() => navigation.goBack()}
        title={t('generalInformation.title')}
        subtitle={t('generalInformation.subtitle')}
        showLegalFooter={false}
      >
        <PersonalInformationForm
          fullName={fullName}
          email={email}
          address={address}
          mobileNumber={user.mobileNumber}
          profilePhotoUri={profilePhotoUri}
          locationCoords={locationCoords}
          onChangeFullName={setFullName}
          onChangeEmail={setEmail}
          onChangeAddress={setAddress}
          onChangeLocationCoords={setLocationCoords}
          onChangePhoto={setProfilePhotoUri}
          onSubmit={handleSave}
          submitLabel={t('generalInformation.saveCta')}
          showMobileLockedHint
          submitDisabled={!isDirty}
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
