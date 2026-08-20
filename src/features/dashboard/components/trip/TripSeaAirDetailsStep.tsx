import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { SeatsStepper } from '@/features/dashboard/components/SeatsStepper';
import { DateTimePickerField } from '@/features/dashboard/components/trip/DateTimePickerField';
import {
  parseTripSeats,
  TripPaymentMethodSection,
} from '@/features/dashboard/components/trip/TripRfqAuctionStep';
import type { TripDraft } from '@/features/dashboard/types/trip.types';
import { terminalToCity, terminalToPoint } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { Button } from '@/shared/components/Button';
import { spacing } from '@/theme';

type TripSeaAirDetailsStepProps = {
  draft: TripDraft;
  onChange: (partial: Partial<TripDraft>) => void;
  onContinue: () => void;
};

function isComplete(draft: TripDraft): boolean {
  const seatsParsed = Number.parseInt(draft.seats.trim(), 10);
  const seatsValid = Number.isInteger(seatsParsed) && seatsParsed >= 1 && seatsParsed <= 50;
  return Boolean(
    draft.departureAt &&
      draft.departureCity?.label.trim() &&
      draft.arrivalCity?.label.trim() &&
      draft.paymentMethod &&
      seatsValid,
  );
}

export function TripSeaAirDetailsStep({
  draft,
  onChange,
  onContinue,
}: TripSeaAirDetailsStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const isAir = draft.routeType === 'air';
  const kind = isAir ? 'airport' : 'port';
  const sameTerminal =
    Boolean(draft.departureCity?.label.trim()) &&
    draft.departureCity?.label.trim().toLowerCase() ===
      draft.arrivalCity?.label.trim().toLowerCase();

  const canContinue = isComplete(draft) && !sameTerminal;

  const applyDeparture = (label: string) => {
    const city = terminalToCity(label, kind);
    const next: Partial<TripDraft> = {
      departureCity: label.trim() ? city : null,
      departurePoint: label.trim() ? terminalToPoint(label) : null,
    };
    if (
      draft.arrivalCity &&
      city.label &&
      draft.arrivalCity.label.trim().toLowerCase() === city.label.toLowerCase()
    ) {
      next.arrivalCity = null;
      next.arrivalPoint = null;
    }
    onChange(next);
  };

  const applyArrival = (label: string) => {
    onChange({
      arrivalCity: label.trim() ? terminalToCity(label, kind) : null,
      arrivalPoint: label.trim() ? terminalToPoint(label) : null,
    });
  };

  return (
    <AuthCard>
      <View style={styles.form}>
        <DateTimePickerField
          variant="search"
          mode="date"
          label={t('trips.create.departureDate')}
          value={draft.departureAt}
          onChange={(departureAt) => onChange({ departureAt, departureTimeSet: false })}
          minimumDate={new Date()}
          required
        />

        <AuthTextField
          label={
            isAir
              ? t('trips.create.departureAirport')
              : t('trips.create.departurePort')
          }
          required
          value={draft.departureCity?.label ?? ''}
          onChangeText={applyDeparture}
          placeholder={
            isAir
              ? t('trips.create.airportPlaceholder')
              : t('trips.create.portPlaceholder')
          }
          autoCapitalize="words"
        />

        <AuthTextField
          label={
            isAir ? t('trips.create.arrivalAirport') : t('trips.create.arrivalPort')
          }
          required
          value={draft.arrivalCity?.label ?? ''}
          onChangeText={applyArrival}
          placeholder={
            isAir
              ? t('trips.create.airportPlaceholder')
              : t('trips.create.portPlaceholder')
          }
          autoCapitalize="words"
          error={sameTerminal ? t('trips.create.sameTerminalNotAllowed') : undefined}
        />

        <SeatsStepper
          label={t('trips.create.seats')}
          required
          value={parseTripSeats(draft.seats)}
          min={1}
          max={50}
          onChange={(seats) => onChange({ seats: String(seats) })}
        />

        <TripPaymentMethodSection
          value={draft.paymentMethod}
          onChange={(paymentMethod) => onChange({ paymentMethod })}
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

        <Button label={t('common.continue')} onPress={onContinue} disabled={!canContinue} />
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
