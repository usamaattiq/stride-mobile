import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { useLocationMapPicker } from '@/features/auth/hooks/useLocationMapPicker';
import { CitySearchField } from '@/features/dashboard/components/trip/CitySearchField';
import { DateTimePickerField } from '@/features/dashboard/components/trip/DateTimePickerField';
import { TripPointField } from '@/features/dashboard/components/trip/TripPointField';
import type { TripDraft } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, spacing } from '@/theme';

type TripDetailsStepProps = {
  draft: TripDraft;
  onChange: (partial: Partial<TripDraft>) => void;
  onContinue: () => void;
};

function isDetailsComplete(draft: TripDraft): boolean {
  const startDateRequired = draft.vehicleMode === 'shared';
  return Boolean(
    draft.departureCity &&
      draft.arrivalCity &&
      (!startDateRequired || draft.departureAt),
  );
}

function getArrivalTimeError(draft: TripDraft, t: (key: string) => string): string | null {
  if (!draft.departureAt || !draft.arrivalAt) {
    return null;
  }
  const depMs = new Date(draft.departureAt).getTime();
  const arrMs = new Date(draft.arrivalAt).getTime();
  if (arrMs <= depMs) {
    return t('trips.create.arrivalAfterDepartureError');
  }
  return null;
}

export function TripDetailsStep({
  draft,
  onChange,
  onContinue,
}: TripDetailsStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { openMapPickerForSelection, mapPickerSheet } = useLocationMapPicker();

  const startDateRequired = draft.vehicleMode === 'shared';

  const departureWindowEnd = draft.departureUntil
    ? new Date(draft.departureUntil)
    : draft.departureAt
      ? new Date(draft.departureAt)
      : undefined;

  const arrivalTimeError = getArrivalTimeError(draft, t);
  const canContinue = isDetailsComplete(draft) && !arrivalTimeError;

  return (
    <>
      <AuthCard>
        <View style={styles.form}>
          <CitySearchField
            label={t('trips.create.departureCity')}
            placeholder={t('trips.create.cityPlaceholder')}
            value={draft.departureCity}
            onChange={(departureCity) => onChange({ departureCity })}
            required
          />

          <TripPointField
            label={t('trips.create.departurePoint')}
            value={draft.departurePoint}
            onSelectOnMap={() =>
              openMapPickerForSelection((selection) => {
                onChange({ departurePoint: selection });
              }, draft.departurePoint)
            }
            optional
          />

          <DateTimePickerField
            label={t('trips.create.departureDateTime')}
            value={draft.departureAt}
            onChange={(departureAt, part) =>
              onChange(part === 'time' ? { departureAt, departureTimeSet: true } : { departureAt })
            }
            minimumDate={new Date()}
            timeConfirmed={draft.departureTimeSet}
            required={startDateRequired}
            optional={!startDateRequired}
          />

          <CitySearchField
            label={t('trips.create.arrivalCity')}
            placeholder={t('trips.create.cityPlaceholder')}
            value={draft.arrivalCity}
            onChange={(arrivalCity) => onChange({ arrivalCity })}
            required
          />

          <TripPointField
            label={t('trips.create.arrivalPoint')}
            value={draft.arrivalPoint}
            onSelectOnMap={() =>
              openMapPickerForSelection((selection) => {
                onChange({ arrivalPoint: selection });
              }, draft.arrivalPoint)
            }
            optional
          />

          <DateTimePickerField
            label={t('trips.create.arrivalDateTime')}
            value={draft.arrivalAt}
            onChange={(arrivalAt, part) =>
              onChange(part === 'time' ? { arrivalAt, arrivalTimeSet: true } : { arrivalAt })
            }
            minimumDate={departureWindowEnd}
            timeConfirmed={draft.arrivalTimeSet}
            optional
          />
          {arrivalTimeError ? (
            <AppText style={styles.fieldError}>{arrivalTimeError}</AppText>
          ) : null}

          <AuthTextField
            label={t('trips.create.description')}
            optional
            value={draft.description}
            onChangeText={(description) => onChange({ description })}
            placeholder={t('trips.create.descriptionPlaceholder')}
            multiline
            textAlignVertical="top"
            style={styles.textArea}
            maxLength={1000}
          />

          <Button
            label={t('common.continue')}
            onPress={onContinue}
            disabled={!canContinue}
          />
        </View>
      </AuthCard>
      {mapPickerSheet}
    </>
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
  fieldError: {
    fontSize: 12,
    color: colors.primary,
    marginTop: -spacing.xs,
  },
});
