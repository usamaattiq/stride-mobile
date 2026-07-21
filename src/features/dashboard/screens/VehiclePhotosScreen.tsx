import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { AppDialog } from '@/shared/components/AppDialog';

import { VehiclePhotosForm } from '../components/VehiclePhotosForm';
import { useVehicles } from '../context/VehicleContext';
import type { HomeStackParamList, VehicleFlowReturnTo } from '../navigation/homeTypes';
import type { Vehicle } from '../types/vehicle.types';

function navigateAfterVehicleSave(
  navigation: NativeStackNavigationProp<HomeStackParamList, 'VehiclePhotos'>,
  returnTo: VehicleFlowReturnTo,
  savedVehicle: Vehicle,
): void {
  if (returnTo === 'TripCreation') {
    navigation.navigate('TripCreation', { selectVehicleId: savedVehicle.id });
    return;
  }
  navigation.navigate('VehicleList');
}

export function VehiclePhotosScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList, 'VehiclePhotos'>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'VehiclePhotos'>>();
  const { draft, patchDraft, saveDraftVehicle } = useVehicles();
  const [savedVisible, setSavedVisible] = React.useState(false);
  const [savedVehicle, setSavedVehicle] = React.useState<Vehicle | null>(null);

  const returnTo = route.params?.returnTo ?? 'VehicleList';

  const handleAddPhotos = (uris: string[]) => {
    patchDraft({ photoUris: [...draft.photoUris, ...uris] });
  };

  const handleRemovePhoto = (index: number) => {
    patchDraft({ photoUris: draft.photoUris.filter((_, itemIndex) => itemIndex !== index) });
  };

  const handleSubmit = () => {
    const cleanedPhotos = draft.photoUris.filter((uri) => uri.length > 0);
    const vehicle = saveDraftVehicle({ photoUris: cleanedPhotos });
    if (vehicle) {
      setSavedVehicle(vehicle);
      setSavedVisible(true);
    }
  };

  return (
    <>
      <AuthScaffold
        onBack={() => navigation.goBack()}
        title={t('vehicles.photos.title')}
        subtitle={t('vehicles.photos.subtitle')}
        showLegalFooter={false}
        stepCount={2}
        currentStep={2}
      >
        <VehiclePhotosForm
          photoUris={draft.photoUris}
          onAddPhotos={handleAddPhotos}
          onRemovePhoto={handleRemovePhoto}
          onSubmit={handleSubmit}
          submitLabel={t('vehicles.photos.cta')}
        />
      </AuthScaffold>

      <AppDialog
        visible={savedVisible}
        icon="check"
        title={t('vehicles.successTitle')}
        message={t('vehicles.successBody')}
        confirmAction={{
          label: t('common.ok'),
          onPress: () => {
            setSavedVisible(false);
            if (savedVehicle) {
              navigateAfterVehicleSave(navigation, returnTo, savedVehicle);
            }
          },
        }}
      />
    </>
  );
}
