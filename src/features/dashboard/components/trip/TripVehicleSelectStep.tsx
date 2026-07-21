import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import {
  VehicleListItem,
  VehiclesEmptyState,
} from '@/features/dashboard/components/VehicleListContent';
import type { Vehicle } from '@/features/dashboard/types/vehicle.types';
import { i18n as appI18n } from '@/i18n';
import { Button } from '@/shared/components/Button';
import { spacing } from '@/theme';

type TripVehicleSelectStepProps = {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string) => void;
  onContinue: () => void;
  onAddVehicle: () => void;
};

export function TripVehicleSelectStep({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  onContinue,
  onAddVehicle,
}: TripVehicleSelectStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  if (vehicles.length === 0) {
    return (
      <AuthCard>
        <VehiclesEmptyState
          title={t('trips.create.noVehiclesTitle')}
          subtitle={t('trips.create.noVehiclesSubtitle')}
          onAddPress={onAddVehicle}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <View style={styles.form}>
        {vehicles.map((vehicle) => (
          <VehicleListItem
            key={vehicle.id}
            vehicle={vehicle}
            selected={vehicle.id === selectedVehicleId}
            onPress={() => onSelectVehicle(vehicle.id)}
          />
        ))}

        <Button label={t('vehicles.addVehicle')} onPress={onAddVehicle} variant="secondary" />
        <Button
          label={t('common.continue')}
          onPress={onContinue}
          disabled={!selectedVehicleId}
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
