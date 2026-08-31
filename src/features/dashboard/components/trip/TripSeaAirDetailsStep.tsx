import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { SeatsStepper } from '@/features/dashboard/components/SeatsStepper';
import { DateTimePickerField } from '@/features/dashboard/components/trip/DateTimePickerField';
import { TerminalSearchField } from '@/features/dashboard/components/trip/TerminalSearchField';
import {
  parseTripSeats,
  TripPaymentMethodSection,
} from '@/features/dashboard/components/trip/TripRfqAuctionStep';
import type { TripDraft } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import type { TerminalSearchItemDto } from '@/services/api/tripApi.types';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, spacing } from '@/theme';

type TripSeaAirDetailsStepProps = {
  draft: TripDraft;
  onChange: (partial: Partial<TripDraft>) => void;
  onContinue: () => void;
  errorMessage?: string | null;
};

function isComplete(draft: TripDraft): boolean {
  const seatsParsed = Number.parseInt(draft.seats.trim(), 10);
  const seatsValid = Number.isInteger(seatsParsed) && seatsParsed >= 1 && seatsParsed <= 50;
  return Boolean(
    draft.departureAt &&
      draft.departureCity?.id &&
      draft.arrivalCity?.id &&
      draft.paymentMethod &&
      seatsValid,
  );
}

function toCityAndPoint(item: TerminalSearchItemDto): {
  city: NonNullable<TripDraft['departureCity']>;
  point: NonNullable<TripDraft['departurePoint']>;
} {
  return {
    city: { id: item.id, label: item.label },
    point: {
      label: item.label,
      latitude: item.latitude,
      longitude: item.longitude,
    },
  };
}

export function TripSeaAirDetailsStep({
  draft,
  onChange,
  onContinue,
  errorMessage,
}: TripSeaAirDetailsStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const isAir = draft.routeType === 'air';
  const kind = isAir ? 'airport' : 'seaport';
  const sameTerminal =
    Boolean(draft.departureCity?.id) && draft.departureCity?.id === draft.arrivalCity?.id;

  const canContinue = isComplete(draft) && !sameTerminal;

  const applyDeparture = (item: TerminalSearchItemDto | null) => {
    if (!item) {
      onChange({ departureCity: null, departurePoint: null });
      return;
    }
    const mapped = toCityAndPoint(item);
    const next: Partial<TripDraft> = {
      departureCity: mapped.city,
      departurePoint: mapped.point,
    };
    if (draft.arrivalCity?.id === item.id) {
      next.arrivalCity = null;
      next.arrivalPoint = null;
    }
    onChange(next);
  };

  const applyArrival = (item: TerminalSearchItemDto | null) => {
    if (!item) {
      onChange({ arrivalCity: null, arrivalPoint: null });
      return;
    }
    const mapped = toCityAndPoint(item);
    onChange({ arrivalCity: mapped.city, arrivalPoint: mapped.point });
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

        <TerminalSearchField
          kind={kind}
          label={isAir ? t('trips.create.departureAirport') : t('trips.create.departurePort')}
          required
          value={draft.departureCity}
          onChange={applyDeparture}
          placeholder={
            isAir ? t('trips.create.airportPlaceholder') : t('trips.create.portPlaceholder')
          }
        />

        <TerminalSearchField
          kind={kind}
          label={isAir ? t('trips.create.arrivalAirport') : t('trips.create.arrivalPort')}
          required
          value={draft.arrivalCity}
          onChange={applyArrival}
          excludeId={draft.departureCity?.id}
          placeholder={
            isAir ? t('trips.create.airportPlaceholder') : t('trips.create.portPlaceholder')
          }
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

        {errorMessage ? (
          <AppText style={styles.error}>{errorMessage}</AppText>
        ) : null}

        <Button
          label={t('common.continue')}
          onPress={onContinue}
          disabled={!canContinue}
          eagerPress
        />
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
  error: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.primary,
  },
});
