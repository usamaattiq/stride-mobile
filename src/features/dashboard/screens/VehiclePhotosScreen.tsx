import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { AppDialog } from '@/shared/components/AppDialog';

import { VehiclePhotosForm } from '../components/VehiclePhotosForm';
import { useVehicles } from '../context/VehicleContext';
import type { HomeStackParamList } from '../navigation/homeTypes';

export function VehiclePhotosScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList, 'VehiclePhotos'>>();
  const { draft, patchDraft, saveDraftVehicle } = useVehicles();
  const [savedVisible, setSavedVisible] = React.useState(false);

  const handleAddPhotos = (uris: string[]) => {
    patchDraft({ photoUris: [...draft.photoUris, ...uris] });
  };

  const handleRemovePhoto = (index: number) => {
    patchDraft({ photoUris: draft.photoUris.filter((_, itemIndex) => itemIndex !== index) });
  };

  const handleSubmit = () => {
    const cleanedPhotos = draft.photoUris.filter((uri) => uri.length > 0);
    if (saveDraftVehicle({ photoUris: cleanedPhotos })) {
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
            navigation.navigate('VehicleList');
          },
        }}
      />
    </>
  );
}
