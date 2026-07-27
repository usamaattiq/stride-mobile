import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, spacing } from '@/theme';

import {
  VehicleListItem,
  VehiclesEmptyState,
} from '../components/VehicleListContent';
import { useVehicles } from '../context/VehicleContext';
import { resolveVehicleStackOrigin } from '../navigation/vehicleNavigation.utils';
import type { VehicleRouteParamList } from '../navigation/vehicleNavigation.types';
import type { Vehicle } from '../types/vehicle.types';

export function VehicleListScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<VehicleRouteParamList, 'VehicleList'>>();
  const {
    vehicles,
    isLoading,
    isSaving,
    loadError,
    beginAddVehicle,
    beginEditVehicle,
    removeVehicle,
    refreshVehicles,
  } = useVehicles();
  const [vehicleToRemove, setVehicleToRemove] = React.useState<Vehicle | null>(null);
  const [removeError, setRemoveError] = React.useState<string | null>(null);
  const stackOrigin = resolveVehicleStackOrigin(navigation);

  useFocusEffect(
    React.useCallback(() => {
      void refreshVehicles().catch(() => undefined);
    }, [refreshVehicles]),
  );

  const openAddFlow = React.useCallback(() => {
    beginAddVehicle();
    navigation.navigate('VehicleDetails', {
      mode: 'add',
      returnTo: 'VehicleList',
      stackOrigin,
    });
  }, [beginAddVehicle, navigation, stackOrigin]);

  const openEditFlow = React.useCallback(
    (vehicle: Vehicle) => {
      if (beginEditVehicle(vehicle.id)) {
        navigation.navigate('VehicleDetails', {
          mode: 'edit',
          vehicleId: vehicle.id,
          returnTo: 'VehicleList',
          stackOrigin,
        });
      }
    },
    [beginEditVehicle, navigation, stackOrigin],
  );

  const handleConfirmRemove = React.useCallback(() => {
    if (!vehicleToRemove || isSaving) {
      return;
    }

    setRemoveError(null);
    void removeVehicle(vehicleToRemove.id)
      .then(() => {
        setVehicleToRemove(null);
      })
      .catch((error) => {
        setRemoveError(getErrorMessage(error, t('vehicles.remove.failed')));
      });
  }, [isSaving, removeVehicle, t, vehicleToRemove]);

  return (
    <AuthScaffold
      onBack={() => navigation.goBack()}
      title={t('vehicles.listTitle')}
      subtitle={t('vehicles.listSubtitle')}
      showLegalFooter={false}
      showLanguageSwitcher={false}
      headerRight={
        <Pressable
          onPress={openAddFlow}
          style={styles.addButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('vehicles.addVehicle')}
        >
          <FontAwesome name="plus" size={16} color={colors.white} />
        </Pressable>
      }
    >
      {isLoading && vehicles.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : loadError && vehicles.length === 0 ? (
        <View style={styles.centered}>
          <AppText style={styles.errorText}>{loadError}</AppText>
          <Button
            label={t('vehicles.retry')}
            onPress={() => {
              void refreshVehicles().catch(() => undefined);
            }}
          />
        </View>
      ) : vehicles.length === 0 ? (
        <VehiclesEmptyState onAddPress={openAddFlow} />
      ) : (
        <View style={styles.content}>
          {vehicles.map((vehicle) => (
            <VehicleListItem
              key={vehicle.id}
              vehicle={vehicle}
              onPress={() => openEditFlow(vehicle)}
              onRemovePress={() => {
                setRemoveError(null);
                setVehicleToRemove(vehicle);
              }}
            />
          ))}
        </View>
      )}

      <AppDialog
        visible={vehicleToRemove !== null}
        icon="trash"
        title={t('vehicles.remove.title')}
        message={
          removeError ??
          (vehicleToRemove
            ? t('vehicles.remove.confirm', { title: vehicleToRemove.title })
            : undefined)
        }
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => {
            if (isSaving) {
              return;
            }
            setVehicleToRemove(null);
            setRemoveError(null);
          },
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
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  content: {
    gap: spacing.sm,
  },
  centered: {
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  errorText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
  },
});
