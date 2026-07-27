import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { useLocationMapPicker } from '@/features/auth/hooks/useLocationMapPicker';
import { CitySearchField } from '@/features/dashboard/components/trip/CitySearchField';
import { DateRangeCalendarField } from '@/features/dashboard/components/trip/DateRangeCalendarField';
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
  return Boolean(
    draft.departureCity &&
      draft.arrivalCity &&
      draft.departureAt &&
      draft.departureUntil,
  );
}

export function TripDetailsStep({
  draft,
  onChange,
  onContinue,
}: TripDetailsStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { openMapPickerForSelection, mapPickerSheet } = useLocationMapPicker();

  const departureWindowEnd = draft.departureUntil
    ? new Date(draft.departureUntil)
    : draft.departureAt
      ? new Date(draft.departureAt)
      : undefined;

  return (
    <>
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
          />

          <AppText weight="medium" style={styles.rowLabel}>
            {t('trips.create.departureDateTime')}
            <AppText style={styles.required}> *</AppText>
          </AppText>
          <View style={styles.row}>
            <View style={styles.rowItemWide}>
              <DateRangeCalendarField
                label={t('trips.create.departureDateWindow')}
                startIso={draft.departureAt}
                endIso={draft.departureUntil}
                onChange={({ startIso, endIso }) =>
                  onChange({ departureAt: startIso, departureUntil: endIso })
                }
                required
                hideLabel
              />
            </View>

            <View style={styles.rowItemNarrow}>
              <DateTimePickerField
                label={t('trips.create.departureTime')}
                value={draft.departureAt}
                onChange={(departureAt) => onChange({ departureAt, departureTimeSet: true })}
                mode="time"
                timeConfirmed={draft.departureTimeSet}
                hideLabel
              />
            </View>
          </View>

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
          />

          <DateTimePickerField
            label={t('trips.create.arrivalDateTime')}
            value={draft.arrivalAt}
            onChange={(arrivalAt, part) =>
              onChange(part === 'time' ? { arrivalAt, arrivalTimeSet: true } : { arrivalAt })
            }
            minimumDate={departureWindowEnd}
            timeConfirmed={draft.arrivalTimeSet}
          />

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
            disabled={!isDetailsComplete(draft)}
          />
      </View>
      {mapPickerSheet}
    </>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.text.primary,
  },
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowItemWide: {
    flex: 6,
  },
  rowItemNarrow: {
    flex: 4,
  },
  textArea: {
    minHeight: 96,
    paddingTop: spacing.sm,
  },
});
