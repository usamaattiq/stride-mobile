import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';

import { VehicleDetailsForm } from '../components/VehicleDetailsForm';
import { useVehicles } from '../context/VehicleContext';
import type { VehicleRouteParamList } from '../navigation/vehicleNavigation.types';
import { resolveVehicleStackOrigin } from '../navigation/vehicleNavigation.utils';
import { isVehicleDetailsValid } from '../utils/vehicleValidation';

export function VehicleDetailsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<VehicleRouteParamList, 'VehicleDetails'>>();
  const route = useRoute<RouteProp<VehicleRouteParamList, 'VehicleDetails'>>();
  const { draft, patchDraft, beginAddVehicle, beginEditVehicle } = useVehicles();

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
    if (!isVehicleDetailsValid(draft)) {
      return;
    }
    const stackOrigin = route.params.stackOrigin ?? resolveVehicleStackOrigin(navigation);
    navigation.navigate('VehiclePhotos', {
      returnTo: route.params.returnTo ?? 'VehicleList',
      stackOrigin,
      vehicleId: route.params.vehicleId,
    });
  };

  return (
    <AuthScaffold
      onBack={() => navigation.goBack()}
      title={t('vehicles.detailsTitle')}
      subtitle={t('vehicles.detailsSubtitle')}
      showLegalFooter={false}
      showLanguageSwitcher={false}
      stepCount={2}
      currentStep={1}
    >
      <VehicleDetailsForm
        draft={draft}
        onChange={patchDraft}
        onSubmit={handleContinue}
        submitLabel={t('vehicles.continue')}
      />
    </AuthScaffold>
  );
}
