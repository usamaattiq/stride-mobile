import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { i18n as appI18n } from '@/i18n';
import { BiometricToggleRow } from '@/shared/components/BiometricToggleRow';
import { Button } from '@/shared/components/Button';
import { KeyboardDoneBar } from '@/shared/components/KeyboardDoneBar';
import { spacing } from '@/theme';

import { VehicleClassPicker } from './VehicleClassPicker';
import { isVehicleDraftComplete, type VehicleDraft } from '../types/vehicle.types';

type VehicleDetailsFormProps = {
  draft: VehicleDraft;
  seatsError?: string;
  onChange: (partial: Partial<VehicleDraft>) => void;
  onSubmit: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
};

export function VehicleDetailsForm({
  draft,
  seatsError,
  onChange,
  onSubmit,
  submitLabel,
  submitDisabled = false,
}: VehicleDetailsFormProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const seatsAccessoryId = React.useId();
  const yearAccessoryId = React.useId();
  const canContinue = isVehicleDraftComplete(draft);

  return (
    <AuthCard>
      <View style={styles.form}>
        <AuthTextField
          label={t('vehicles.fields.title')}
          required
          value={draft.title}
          onChangeText={(value) => onChange({ title: value })}
          placeholder={t('vehicles.fields.titlePlaceholder')}
        />

        <AuthTextField
          label={t('vehicles.fields.description')}
          required
          value={draft.description}
          onChangeText={(value) => onChange({ description: value })}
          placeholder={t('vehicles.fields.descriptionPlaceholder')}
          multiline
          textAlignVertical="top"
          style={styles.textArea}
        />

        <AuthTextField
          label={t('vehicles.fields.plateNumber')}
          required
          value={draft.plateNumber}
          onChangeText={(value) => onChange({ plateNumber: value })}
          placeholder={t('vehicles.fields.plateNumberPlaceholder')}
          autoCapitalize="characters"
        />

        <BiometricToggleRow
          iconName="snowflake"
          enabled={draft.hasAc}
          title={t('vehicles.fields.acTitle')}
          subtitle={
            draft.hasAc ? t('vehicles.fields.acOn') : t('vehicles.fields.acOff')
          }
          onToggle={(hasAc) => onChange({ hasAc })}
        />

        <AuthTextField
          label={t('vehicles.fields.totalSeats')}
          required
          value={draft.totalSeats}
          onChangeText={(value) => onChange({ totalSeats: value.replace(/\D/g, '') })}
          placeholder={t('vehicles.fields.totalSeatsPlaceholder')}
          keyboardType="number-pad"
          inputAccessoryViewID={seatsAccessoryId}
          error={seatsError}
        />
        <KeyboardDoneBar
          nativeID={seatsAccessoryId}
          disabled={!canContinue}
          onDone={onSubmit}
        />

        <VehicleClassPicker
          label={t('vehicles.fields.class')}
          placeholder={t('vehicles.classPlaceholder')}
          value={draft.vehicleClass}
          onChange={(vehicleClass) => onChange({ vehicleClass })}
          required
        />

        <AuthTextField
          label={t('vehicles.fields.brand')}
          value={draft.brand}
          onChangeText={(value) => onChange({ brand: value })}
          placeholder={t('vehicles.fields.brandPlaceholder')}
        />

        <AuthTextField
          label={t('vehicles.fields.model')}
          value={draft.model}
          onChangeText={(value) => onChange({ model: value })}
          placeholder={t('vehicles.fields.modelPlaceholder')}
        />

        <AuthTextField
          label={t('vehicles.fields.year')}
          value={draft.year}
          onChangeText={(value) => onChange({ year: value.replace(/\D/g, '').slice(0, 4) })}
          placeholder={t('vehicles.fields.yearPlaceholder')}
          keyboardType="number-pad"
          inputAccessoryViewID={yearAccessoryId}
        />
        <KeyboardDoneBar
          nativeID={yearAccessoryId}
          disabled={!canContinue}
          onDone={onSubmit}
        />

        <Button label={submitLabel} onPress={onSubmit} disabled={submitDisabled || !canContinue} />
      </View>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
  textArea: {
    minHeight: 96,
    paddingTop: spacing.sm,
  },
});
