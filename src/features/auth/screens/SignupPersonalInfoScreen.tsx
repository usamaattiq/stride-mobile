import React from 'react';
import { useTranslation } from 'react-i18next';

import type { CountryOption } from '@/features/auth/constants/countries';
import type { LocationCoords } from '@/features/auth/types/signup.types';
import { formatPhoneDisplay } from '@/features/auth/types/signup.types';
import { i18n as appI18n } from '@/i18n';
import { PersonalInformationForm } from '@/shared/components/PersonalInformationForm';

type SignupPersonalInfoScreenProps = {
  country: CountryOption;
  phoneDigits: string;
  fullName: string;
  email: string;
  address: string;
  locationCoords: LocationCoords | null;
  profilePhotoUri: string | null;
  onChangeFullName: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onChangeAddress: (value: string) => void;
  onChangeLocationCoords: (coords: LocationCoords | null) => void;
  onChangePhoto: (uri: string | null) => void;
  onContinue: () => void;
};

/** Signup step — shared personal info form; heading lives on AuthScaffold. */
export function SignupPersonalInfoScreen({
  country,
  phoneDigits,
  fullName,
  email,
  address,
  locationCoords,
  profilePhotoUri,
  onChangeFullName,
  onChangeEmail,
  onChangeAddress,
  onChangeLocationCoords,
  onChangePhoto,
  onContinue,
}: SignupPersonalInfoScreenProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <PersonalInformationForm
      fullName={fullName}
      email={email}
      address={address}
      mobileNumber={formatPhoneDisplay(country, phoneDigits)}
      profilePhotoUri={profilePhotoUri}
      locationCoords={locationCoords}
      onChangeFullName={onChangeFullName}
      onChangeEmail={onChangeEmail}
      onChangeAddress={onChangeAddress}
      onChangeLocationCoords={onChangeLocationCoords}
      onChangePhoto={onChangePhoto}
      onSubmit={onContinue}
      submitLabel={t('auth.signup.personal.cta')}
    />
  );
}
