import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { DurationSlider } from '@/features/dashboard/components/trip/DurationSlider';
import { OptionButtonGroup } from '@/features/dashboard/components/trip/OptionButtonGroup';
import type { TripDraft } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { Button } from '@/shared/components/Button';
import { spacing } from '@/theme';

type TripRfqAuctionStepProps = {
  draft: TripDraft;
  onChange: (partial: Partial<TripDraft>) => void;
  onContinue: () => void;
};

function isListingComplete(draft: TripDraft): boolean {
  return Boolean(draft.listingType && draft.paymentMethod);
}

export function TripRfqAuctionStep({
  draft,
  onChange,
  onContinue,
}: TripRfqAuctionStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <AuthCard>
      <View style={styles.form}>
        <OptionButtonGroup
          label={t('trips.create.listingTypeLabel')}
          required
          value={draft.listingType}
          onChange={(listingType) => onChange({ listingType })}
          options={[
            { id: 'rfq', label: t('trips.create.listingRfq') },
            { id: 'auction', label: t('trips.create.listingAuction') },
          ]}
        />

        <AuthTextField
          label={t('trips.create.startingPrice')}
          optional
          value={draft.startingPrice}
          onChangeText={(startingPrice) => onChange({ startingPrice })}
          placeholder={t('trips.create.startingPricePlaceholder')}
          keyboardType="decimal-pad"
          dense
        />

        <OptionButtonGroup
          label={t('trips.create.paymentMethodLabel')}
          required
          value={draft.paymentMethod}
          onChange={(paymentMethod) => onChange({ paymentMethod })}
          options={[
            { id: 'cash', label: t('trips.create.paymentCash') },
            { id: 'online', label: t('trips.create.paymentOnline') },
          ]}
        />

        <DurationSlider
          label={t('trips.create.durationLabel')}
          value={draft.durationHours}
          onChange={(durationHours) => onChange({ durationHours })}
        />

        <Button
          label={t('common.continue')}
          onPress={onContinue}
          disabled={!isListingComplete(draft)}
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
