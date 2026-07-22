import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import type { Vehicle } from '@/features/dashboard/types/vehicle.types';
import type { TripDraft } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

type TripPreviewStepProps = {
  draft: TripDraft;
  vehicle: Vehicle | undefined;
  onPublish: () => void;
  publishing?: boolean;
  errorMessage?: string | null;
};

function formatDateTime(iso: string | null, locale: string): string {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type PreviewRowProps = {
  label: string;
  value: string;
};

function PreviewRow({ label, value }: PreviewRowProps): React.ReactElement {
  return (
    <View style={styles.row}>
      <AppText style={styles.rowLabel}>{label}</AppText>
      <AppText weight="semibold" style={styles.rowValue}>
        {value}
      </AppText>
    </View>
  );
}

export function TripPreviewStep({
  draft,
  vehicle,
  onPublish,
  publishing = false,
  errorMessage = null,
}: TripPreviewStepProps): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const locale = i18n.language;

  const vehicleModeLabel =
    draft.vehicleMode === 'shared'
      ? t('trips.create.vehicleModeShared')
      : draft.vehicleMode === 'fullPrivate'
        ? t('trips.create.vehicleModeFullPrivate')
        : '—';

  const listingLabel =
    draft.listingType === 'rfq'
      ? t('trips.create.listingRfq')
      : draft.listingType === 'auction'
        ? t('trips.create.listingAuction')
        : '—';

  const paymentLabel =
    draft.paymentMethod === 'cash'
      ? t('trips.create.paymentCash')
      : draft.paymentMethod === 'online'
        ? t('trips.create.paymentOnline')
        : '—';

  const startLabel =
    draft.startMode === 'instant'
      ? t('trips.create.startInstant')
      : draft.startMode === 'scheduled'
        ? formatDateTime(draft.scheduledStartAt, locale)
        : '—';

  const priceLabel = draft.startingPrice.trim()
    ? draft.startingPrice.trim()
    : t('trips.create.notSpecified');

  return (
    <AuthCard>
      <View style={styles.form}>
        <AppText weight="semibold" style={styles.sectionTitle}>
          {t('trips.create.previewTrip')}
        </AppText>

        <PreviewRow label={t('trips.create.previewVehicle')} value={vehicle?.title ?? '—'} />
        <PreviewRow label={t('trips.create.vehicleModeLabel')} value={vehicleModeLabel} />
        <PreviewRow
          label={t('trips.create.departureCity')}
          value={draft.departureCity?.label ?? '—'}
        />
        <PreviewRow
          label={t('trips.create.departurePoint')}
          value={draft.departurePoint?.label ?? '—'}
        />
        <PreviewRow
          label={t('trips.create.departureDateTime')}
          value={formatDateTime(draft.departureAt, locale)}
        />
        <PreviewRow
          label={t('trips.create.arrivalCity')}
          value={draft.arrivalCity?.label ?? '—'}
        />
        <PreviewRow
          label={t('trips.create.arrivalPoint')}
          value={draft.arrivalPoint?.label ?? '—'}
        />
        <PreviewRow
          label={t('trips.create.arrivalDateTime')}
          value={formatDateTime(draft.arrivalAt, locale)}
        />

        <AppText weight="semibold" style={styles.sectionTitle}>
          {t('trips.create.previewListing')}
        </AppText>

        <PreviewRow label={t('trips.create.listingTypeLabel')} value={listingLabel} />
        <PreviewRow label={t('trips.create.startingPrice')} value={priceLabel} />
        <PreviewRow label={t('trips.create.paymentMethodLabel')} value={paymentLabel} />
        <PreviewRow
          label={t('trips.create.durationLabel')}
          value={t('trips.create.durationValue', { count: draft.durationHours })}
        />
        <PreviewRow label={t('trips.create.startModeLabel')} value={startLabel} />

        {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}

        <Button
          label={t('trips.create.publish')}
          onPress={onPublish}
          loading={publishing}
          disabled={publishing}
        />
      </View>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    color: colors.text.primary,
    marginTop: spacing.xxs,
  },
  row: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.subtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  rowLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  rowValue: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 19,
  },
  errorText: {
    fontSize: 12,
    color: colors.primary,
  },
});
