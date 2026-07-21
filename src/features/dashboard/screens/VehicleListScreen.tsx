import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { AppDialog } from '@/shared/components/AppDialog';
import { Button } from '@/shared/components/Button';
import { spacing } from '@/theme';

import {
  VehicleListItem,
  VehiclesEmptyState,
} from '../components/VehicleListContent';
import { useVehicles } from '../context/VehicleContext';
import type { HomeStackParamList } from '../navigation/homeTypes';
import type { Vehicle } from '../types/vehicle.types';

export function VehicleListScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList, 'VehicleList'>>();
  const { vehicles, beginAddVehicle, beginEditVehicle, removeVehicle } = useVehicles();
  const [vehicleToRemove, setVehicleToRemove] = React.useState<Vehicle | null>(null);

  const openAddFlow = React.useCallback(() => {
    beginAddVehicle();
    navigation.navigate('VehicleDetails', { mode: 'add' });
  }, [beginAddVehicle, navigation]);

  const openEditFlow = React.useCallback(
    (vehicle: Vehicle) => {
      if (beginEditVehicle(vehicle.id)) {
        navigation.navigate('VehicleDetails', { mode: 'edit', vehicleId: vehicle.id });
      }
    },
    [beginEditVehicle, navigation],
  );

  const handleConfirmRemove = React.useCallback(() => {
    if (!vehicleToRemove) {
      return;
    }
    removeVehicle(vehicleToRemove.id);
    setVehicleToRemove(null);
  }, [removeVehicle, vehicleToRemove]);

  return (
    <AuthScaffold
      onBack={() => navigation.goBack()}
      title={t('vehicles.listTitle')}
      subtitle={t('vehicles.listSubtitle')}
      showLegalFooter={false}
    >
      {vehicles.length === 0 ? (
        <VehiclesEmptyState onAddPress={openAddFlow} />
      ) : (
        <View style={styles.content}>
          {vehicles.map((vehicle) => (
            <VehicleListItem
              key={vehicle.id}
              vehicle={vehicle}
              onPress={() => openEditFlow(vehicle)}
              onRemovePress={() => setVehicleToRemove(vehicle)}
            />
          ))}
          <Button label={t('vehicles.addVehicle')} onPress={openAddFlow} />
        </View>
      )}

      <AppDialog
        visible={vehicleToRemove !== null}
        icon="trash"
        title={t('vehicles.remove.title')}
        message={
          vehicleToRemove
            ? t('vehicles.remove.confirm', { title: vehicleToRemove.title })
            : undefined
        }
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => setVehicleToRemove(null),
        }}
        confirmAction={{
          label: t('vehicles.remove.confirmAction'),
          onPress: handleConfirmRemove,
        }}
      />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
});
