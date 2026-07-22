import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { DateTimePickerField } from '@/features/dashboard/components/trip/DateTimePickerField';
import { OptionButtonGroup } from '@/features/dashboard/components/trip/OptionButtonGroup';
import type { TripDraft } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { Button } from '@/shared/components/Button';
import { spacing } from '@/theme';

type TripScheduleStepProps = {
  draft: TripDraft;
  onChange: (partial: Partial<TripDraft>) => void;
  onContinue: () => void;
};

function isScheduleComplete(draft: TripDraft): boolean {
  if (!draft.startMode) {
    return false;
  }
  if (draft.startMode === 'instant') {
    return true;
  }
  return Boolean(draft.scheduledStartAt);
}

export function TripScheduleStep({
  draft,
  onChange,
  onContinue,
}: TripScheduleStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <AuthCard>
      <View style={styles.form}>
        <OptionButtonGroup
          label={t('trips.create.startModeLabel')}
          required
          value={draft.startMode}
          onChange={(startMode) =>
            onChange({
              startMode,
              scheduledStartAt: startMode === 'instant' ? null : draft.scheduledStartAt,
            })
          }
          options={[
            { id: 'instant', label: t('trips.create.startInstant') },
            { id: 'scheduled', label: t('trips.create.startScheduled') },
          ]}
        />

        {draft.startMode === 'scheduled' ? (
          <DateTimePickerField
            label={t('trips.create.scheduledStart')}
            value={draft.scheduledStartAt}
            onChange={(scheduledStartAt) => onChange({ scheduledStartAt })}
            minimumDate={new Date()}
            required
          />
        ) : null}

        <Button
          label={t('common.continue')}
          onPress={onContinue}
          disabled={!isScheduleComplete(draft)}
        />
      </View>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
});
