import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { ProfilePhotoPicker } from '@/features/auth/components/ProfilePhotoPicker';
import { SignupLocationField } from '@/features/auth/components/SignupLocationField';
import {
  useLocationMapPicker,
  type LocationSelection,
} from '@/features/auth/hooks/useLocationMapPicker';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { isValidEmail } from '@/shared/utils/email-validation';
import { colors, spacing } from '@/theme';

export type PersonalInformationCoords = {
  latitude: number;
  longitude: number;
};

export type PersonalInformationFormProps = {
  fullName: string;
  email: string;
  address: string;
  mobileNumber: string;
  profilePhotoUri: string | null;
  locationCoords: PersonalInformationCoords | null;
  onChangeFullName: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onChangeAddress: (value: string) => void;
  onChangeLocationCoords: (coords: PersonalInformationCoords | null) => void;
  onChangePhoto: (uri: string | null) => void;
  onSubmit: () => void;
  /** CTA label — e.g. Continue (signup) or Save changes (settings). */
  submitLabel: string;
  /** Hint under the locked mobile field (settings). */
  showMobileLockedHint?: boolean;
  /** Extra gate on top of built-in validation (e.g. require dirty in settings). */
  submitDisabled?: boolean;
  /** Show remove control under the photo (settings). */
  allowRemovePhoto?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
};

/**
 * Shared personal-information form for signup + Settings.
 * Parents own the AuthScaffold heading; only submitLabel / mobile hint differ.
 */
export function PersonalInformationForm({
  fullName,
  email,
  address,
  mobileNumber,
  profilePhotoUri,
  locationCoords,
  onChangeFullName,
  onChangeEmail,
  onChangeAddress,
  onChangeLocationCoords,
  onChangePhoto,
  onSubmit,
  submitLabel,
  showMobileLockedHint = false,
  submitDisabled = false,
  allowRemovePhoto = false,
  loading = false,
  errorMessage = null,
}: PersonalInformationFormProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { locationLoading, openMapPickerForSelection, getCurrentLocation, mapPickerSheet } =
    useLocationMapPicker();

  const emailIsValid = isValidEmail(email);
  const emailError =
    email.trim().length > 0 && !emailIsValid ? t('auth.signup.personal.emailInvalid') : undefined;

  const canSubmit =
    !submitDisabled &&
    !loading &&
    fullName.trim().length > 1 &&
    emailIsValid &&
    (Boolean(locationCoords) || address.trim().length > 0);

  const applySelection = React.useCallback(
    (selection: LocationSelection) => {
      onChangeAddress(selection.label);
      onChangeLocationCoords({
        latitude: selection.latitude,
        longitude: selection.longitude,
      });
    },
    [onChangeAddress, onChangeLocationCoords],
  );

  const handleUseCurrentLocation = React.useCallback(async () => {
    const selection = await getCurrentLocation();
    if (selection) {
      applySelection(selection);
    }
  }, [getCurrentLocation, applySelection]);

  const handleSelectOnMap = React.useCallback(() => {
    openMapPickerForSelection(
      applySelection,
      locationCoords
        ? {
            label: address,
            latitude: locationCoords.latitude,
            longitude: locationCoords.longitude,
          }
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
          allowRemove={allowRemovePhoto}
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
        <View>
          <AuthTextField
            label={t('auth.signup.personal.mobile')}
            required
            dense
            value={mobileNumber}
            editable={false}
            selectTextOnFocus={false}
            style={styles.readonly}
          />
          {showMobileLockedHint ? (
            <AppText style={styles.mobileHint}>
              {t('generalInformation.mobileLockedHint')}
            </AppText>
          ) : null}
        </View>
        <AuthTextField
          label={t('auth.signup.personal.email')}
          optional
          dense
          value={email}
          onChangeText={onChangeEmail}
          placeholder={t('auth.signup.personal.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={emailError}
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
        <Button label={submitLabel} onPress={onSubmit} disabled={!canSubmit} loading={loading} />
        {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}
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
  mobileHint: {
    marginTop: spacing.xxs,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.tertiary,
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primary,
    textAlign: 'center',
  },
});
