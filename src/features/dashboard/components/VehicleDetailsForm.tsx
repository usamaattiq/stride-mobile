import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { i18n as appI18n } from '@/i18n';
import { BiometricToggleRow } from '@/shared/components/BiometricToggleRow';
import { Button } from '@/shared/components/Button';
import { KeyboardDoneBar } from '@/shared/components/KeyboardDoneBar';
import { onlyLatinDigits } from '@/shared/utils/latin-digits';
import { spacing } from '@/theme';

import {
  DEFAULT_SEATS_MAX,
  DEFAULT_SEATS_MIN,
  SeatsStepper,
} from './SeatsStepper';
import { VehicleClassPicker } from './VehicleClassPicker';
import type { VehicleDraft } from '../types/vehicle.types';
import {
  getVehicleFieldErrorKey,
  isVehicleDetailsValid,
  type VehicleDetailsField,
} from '../utils/vehicleValidation';

type VehicleDetailsFormProps = {
  draft: VehicleDraft;
  onChange: (partial: Partial<VehicleDraft>) => void;
  onSubmit: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
};

function parseSeatCount(value: string): number {
  const seats = Number.parseInt(value.trim(), 10);
  return Number.isFinite(seats) && seats > 0 ? seats : DEFAULT_SEATS_MIN;
}

export function VehicleDetailsForm({
  draft,
  onChange,
  onSubmit,
  submitLabel,
  submitDisabled = false,
}: VehicleDetailsFormProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const yearAccessoryId = React.useId();
  const seatCount = parseSeatCount(draft.totalSeats);

  const [touched, setTouched] = React.useState<Partial<Record<VehicleDetailsField, boolean>>>(
    {},
  );
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  const markTouched = React.useCallback((field: VehicleDetailsField) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }, []);

  const fieldError = (field: VehicleDetailsField): string | undefined => {
    if (!touched[field] && !submitAttempted) {
      return undefined;
    }
    const key = getVehicleFieldErrorKey(field, draft);
    return key ? t(key) : undefined;
  };

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (!isVehicleDetailsValid(draft) || submitDisabled) {
      return;
    }
    onSubmit();
  };

  return (
    <AuthCard>
      <View style={styles.form}>
        <AuthTextField
          label={t('vehicles.fields.title')}
          required
          value={draft.title}
          onChangeText={(value) => onChange({ title: value })}
          onBlur={() => markTouched('title')}
          placeholder={t('vehicles.fields.titlePlaceholder')}
          error={fieldError('title')}
        />

        <AuthTextField
          label={t('vehicles.fields.description')}
          required
          value={draft.description}
          onChangeText={(value) => onChange({ description: value })}
          onBlur={() => markTouched('description')}
          placeholder={t('vehicles.fields.descriptionPlaceholder')}
          multiline
          textAlignVertical="top"
          style={styles.textArea}
          error={fieldError('description')}
        />

        <AuthTextField
          label={t('vehicles.fields.plateNumber')}
          required
          value={draft.plateNumber}
          onChangeText={(value) => onChange({ plateNumber: value })}
          onBlur={() => markTouched('plateNumber')}
          placeholder={t('vehicles.fields.plateNumberPlaceholder')}
          autoCapitalize="characters"
          error={fieldError('plateNumber')}
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

        <SeatsStepper
          label={t('vehicles.fields.totalSeats')}
          required
          value={seatCount}
          min={DEFAULT_SEATS_MIN}
          max={DEFAULT_SEATS_MAX}
          onChange={(next) => {
            markTouched('totalSeats');
            onChange({ totalSeats: String(next) });
          }}
          error={fieldError('totalSeats')}
        />

        <VehicleClassPicker
          label={t('vehicles.fields.class')}
          placeholder={t('vehicles.classPlaceholder')}
          value={draft.vehicleClass}
          onChange={(vehicleClass) => {
            markTouched('vehicleClass');
            onChange({ vehicleClass });
          }}
          onBlur={() => markTouched('vehicleClass')}
          required
          error={fieldError('vehicleClass')}
        />

        <AuthTextField
          label={t('vehicles.fields.brand')}
          value={draft.brand}
          onChangeText={(value) => onChange({ brand: value })}
          onBlur={() => markTouched('brand')}
          placeholder={t('vehicles.fields.brandPlaceholder')}
          error={fieldError('brand')}
        />

        <AuthTextField
          label={t('vehicles.fields.model')}
          value={draft.model}
          onChangeText={(value) => onChange({ model: value })}
          onBlur={() => markTouched('model')}
          placeholder={t('vehicles.fields.modelPlaceholder')}
          error={fieldError('model')}
        />

        <AuthTextField
          label={t('vehicles.fields.year')}
          value={draft.year}
          onChangeText={(value) => onChange({ year: onlyLatinDigits(value).slice(0, 4) })}
          onBlur={() => markTouched('year')}
          placeholder={t('vehicles.fields.yearPlaceholder')}
          keyboardType="number-pad"
          inputAccessoryViewID={yearAccessoryId}
          error={fieldError('year')}
        />
        <KeyboardDoneBar
          nativeID={yearAccessoryId}
          disabled={submitDisabled}
          onDone={handleSubmit}
        />

        <Button label={submitLabel} onPress={handleSubmit} disabled={submitDisabled} />
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
