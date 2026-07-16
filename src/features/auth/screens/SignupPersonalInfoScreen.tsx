import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { Button } from '@/shared/components/Button';
import { colors, spacing } from '@/theme';

import { AuthCard } from '../components/AuthCard';
import { AuthTextField } from '../components/AuthTextField';
import { ProfilePhotoPicker } from '../components/ProfilePhotoPicker';
import { SignupLocationField } from '../components/SignupLocationField';
import type { CountryOption } from '../constants/countries';
import { useLocationMapPicker, type LocationSelection } from '../hooks/useLocationMapPicker';
import type { LocationCoords } from '../types/signup.types';
import { formatPhoneDisplay } from '../types/signup.types';

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
  const { locationLoading, openMapPickerForSelection, getCurrentLocation, mapPickerSheet } =
    useLocationMapPicker();

  const canContinue =
    fullName.trim().length > 1 && (!!locationCoords || address.trim().length > 0);

  const applySelection = React.useCallback(
    (selection: LocationSelection) => {
      onChangeAddress(selection.label);
      onChangeLocationCoords({ latitude: selection.latitude, longitude: selection.longitude });
    },
    [onChangeAddress, onChangeLocationCoords],
  );

  const handleUseCurrentLocation = React.useCallback(async () => {
    const selection = await getCurrentLocation();
    if (selection) applySelection(selection);
  }, [getCurrentLocation, applySelection]);

  const handleSelectOnMap = React.useCallback(() => {
    openMapPickerForSelection(
      applySelection,
      locationCoords
        ? { label: address, latitude: locationCoords.latitude, longitude: locationCoords.longitude }
        : null,
    );
  }, [openMapPickerForSelection, applySelection, locationCoords, address]);

  return (
    <>
      <AuthCard>
        <ProfilePhotoPicker
          uri={profilePhotoUri}
          onChange={onChangePhoto}
          label={t('auth.signup.personal.photo')}
          hint={t('auth.signup.personal.photoHint')}
        />
        <AuthTextField
          label={t('auth.signup.personal.fullName')}
          required
          dense
          value={fullName}
          onChangeText={onChangeFullName}
          placeholder={t('auth.signup.personal.fullNamePlaceholder')}
          autoCapitalize="words"
        />
        <AuthTextField
          label={t('auth.signup.personal.mobile')}
          required
          dense
          value={formatPhoneDisplay(country, phoneDigits)}
          editable={false}
          selectTextOnFocus={false}
          style={styles.readonly}
        />
        <AuthTextField
          label={t('auth.signup.personal.email')}
          optional
          dense
          value={email}
          onChangeText={onChangeEmail}
          placeholder={t('auth.signup.personal.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <SignupLocationField
          label={t('auth.signup.personal.address')}
          required
          dense
          value={address}
          loading={locationLoading}
          onChangeText={onChangeAddress}
          onUseCurrentLocation={() => void handleUseCurrentLocation()}
          onSelectOnMap={handleSelectOnMap}
        />

        <Button
          label={t('auth.signup.personal.cta')}
          onPress={onContinue}
          disabled={!canContinue}
        />
      </AuthCard>
      <View style={styles.spacer} />

      {mapPickerSheet}
    </>
  );
}

const styles = StyleSheet.create({
  spacer: { height: spacing.md },
  readonly: {
    backgroundColor: colors.background.subtle,
    color: colors.text.secondary,
  },
});
