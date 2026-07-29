import React from 'react';
import { FontAwesome5 } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { BiometricToggleRow } from '@/shared/components/BiometricToggleRow';
import { Button } from '@/shared/components/Button';
import { KeyboardDoneBar } from '@/shared/components/KeyboardDoneBar';
import { colors, radius, spacing } from '@/theme';

import { VehicleClassPicker } from './VehicleClassPicker';
import { isVehicleDraftComplete, type VehicleDraft } from '../types/vehicle.types';

const MIN_SEATS = 1;
const MAX_SEATS = 60;

type VehicleDetailsFormProps = {
  draft: VehicleDraft;
  seatsError?: string;
  onChange: (partial: Partial<VehicleDraft>) => void;
  onSubmit: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
};

function parseSeatCount(value: string): number {
  const seats = Number.parseInt(value.trim(), 10);
  return Number.isFinite(seats) && seats > 0 ? seats : MIN_SEATS;
}

export function VehicleDetailsForm({
  draft,
  seatsError,
  onChange,
  onSubmit,
  submitLabel,
  submitDisabled = false,
}: VehicleDetailsFormProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const yearAccessoryId = React.useId();
  const canContinue = isVehicleDraftComplete(draft);
  const seatCount = parseSeatCount(draft.totalSeats);

  const setSeatCount = (next: number) => {
    onChange({ totalSeats: String(Math.max(MIN_SEATS, Math.min(MAX_SEATS, next))) });
  };

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

        <View style={styles.seatsWrap}>
          <AppText weight="medium" style={styles.seatsLabel}>
            {t('vehicles.fields.totalSeats')}
            <AppText style={styles.required}> *</AppText>
          </AppText>
          <View style={[styles.seatsRow, seatsError ? styles.seatsRowError : null]}>
            <AppText weight="semibold" style={styles.seatsCaption} numberOfLines={1}>
              {t('vehicles.seatsCount', { count: seatCount })}
            </AppText>
            <View style={styles.stepper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('vehicles.fields.decreaseSeats')}
                disabled={seatCount <= MIN_SEATS}
                onPress={() => setSeatCount(seatCount - 1)}
                style={({ pressed }) => [
                  styles.stepperButton,
                  seatCount <= MIN_SEATS && styles.stepperButtonDisabled,
                  pressed && seatCount > MIN_SEATS && styles.pressed,
                ]}
              >
                <FontAwesome5
                  name="minus"
                  size={12}
                  color={seatCount <= MIN_SEATS ? colors.text.tertiary : colors.primary}
                  solid
                />
              </Pressable>
              <AppText weight="bold" style={styles.stepperValue}>
                {seatCount}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('vehicles.fields.increaseSeats')}
                disabled={seatCount >= MAX_SEATS}
                onPress={() => setSeatCount(seatCount + 1)}
                style={({ pressed }) => [
                  styles.stepperButton,
                  seatCount >= MAX_SEATS && styles.stepperButtonDisabled,
                  pressed && seatCount < MAX_SEATS && styles.pressed,
                ]}
              >
                <FontAwesome5
                  name="plus"
                  size={12}
                  color={seatCount >= MAX_SEATS ? colors.text.tertiary : colors.primary}
                  solid
                />
              </Pressable>
            </View>
          </View>
          {seatsError ? <AppText style={styles.seatsError}>{seatsError}</AppText> : null}
        </View>

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
  seatsWrap: {
    gap: spacing.xs,
  },
  seatsLabel: {
    fontSize: 13,
    color: colors.text.primary,
  },
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  seatsRow: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  seatsRowError: {
    borderColor: colors.primary,
  },
  seatsCaption: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.45,
    borderColor: colors.border.default,
    backgroundColor: colors.background.subtle,
  },
  stepperValue: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 16,
    color: colors.text.primary,
  },
  seatsError: {
    fontSize: 12,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
