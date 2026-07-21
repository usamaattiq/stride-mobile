import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';

import { VehicleDetailsForm } from '../components/VehicleDetailsForm';
import { useVehicles } from '../context/VehicleContext';
import type { HomeStackParamList } from '../navigation/homeTypes';
import { isVehicleDraftComplete } from '../types/vehicle.types';

export function VehicleDetailsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList, 'VehicleDetails'>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'VehicleDetails'>>();
  const { draft, patchDraft, beginAddVehicle, beginEditVehicle } = useVehicles();
  const [seatsError, setSeatsError] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (route.params.mode === 'add') {
      beginAddVehicle();
      return;
    }
    if (route.params.vehicleId) {
      beginEditVehicle(route.params.vehicleId);
    }
  }, []);

  const handleContinue = () => {
    const seats = Number.parseInt(draft.totalSeats.trim(), 10);
    if (!Number.isFinite(seats) || seats <= 0) {
      setSeatsError(t('vehicles.errors.seatsRequired'));
      return;
    }
    if (!isVehicleDraftComplete(draft)) {
      return;
    }
    setSeatsError(undefined);
    navigation.navigate('VehiclePhotos');
  };

  return (
    <AuthScaffold
      onBack={() => navigation.goBack()}
      title={t('vehicles.detailsTitle')}
      subtitle={t('vehicles.detailsSubtitle')}
      showLegalFooter={false}
      stepCount={2}
      currentStep={1}
    >
      <VehicleDetailsForm
        draft={draft}
        seatsError={seatsError}
        onChange={patchDraft}
        onSubmit={handleContinue}
        submitLabel={t('vehicles.continue')}
      />
    </AuthScaffold>
  );
}
