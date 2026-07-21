import React from 'react';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { OptionButtonGroup } from '@/features/dashboard/components/trip/OptionButtonGroup';
import type { TripVehicleMode } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { Button } from '@/shared/components/Button';
import { spacing } from '@/theme';
import { StyleSheet, View } from 'react-native';

type TripVehicleModeStepProps = {
  value: TripVehicleMode | null;
  onChange: (value: TripVehicleMode) => void;
  onContinue: () => void;
};

export function TripVehicleModeStep({
  value,
  onChange,
  onContinue,
}: TripVehicleModeStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <AuthCard>
      <View style={styles.form}>
        <OptionButtonGroup
          label={t('trips.create.vehicleModeLabel')}
          required
          value={value}
          onChange={onChange}
          options={[
            { id: 'shared', label: t('trips.create.vehicleModeShared') },
            { id: 'fullPrivate', label: t('trips.create.vehicleModeFullPrivate') },
          ]}
        />
        <Button label={t('common.continue')} onPress={onContinue} disabled={!value} />
      </View>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
});
