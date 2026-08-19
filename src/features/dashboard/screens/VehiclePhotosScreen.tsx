import React from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { colors, spacing } from '@/theme';

import { VehiclePhotosForm } from '../components/VehiclePhotosForm';
import { useVehicles } from '../context/VehicleContext';
import { completeVehicleFlow } from '../navigation/homeStackNavigation';
import { resolveVehicleStackOrigin } from '../navigation/vehicleNavigation.utils';
import type {
  VehicleFlowReturnTo,
  VehicleRouteParamList,
  VehicleStackOrigin,
} from '../navigation/vehicleNavigation.types';
import { MAX_VEHICLE_PHOTOS, type Vehicle } from '../types/vehicle.types';

function navigateAfterVehicleSave(
  navigation: NativeStackNavigationProp<VehicleRouteParamList, 'VehiclePhotos'>,
  returnTo: VehicleFlowReturnTo,
  savedVehicle: Vehicle,
  stackOrigin: VehicleStackOrigin,
  listingTripId?: string,
): void {
  completeVehicleFlow(navigation, returnTo, {
    selectVehicleId: savedVehicle.id,
    stackOrigin,
    listingTripId,
  });
}

export function VehiclePhotosScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<VehicleRouteParamList, 'VehiclePhotos'>>();
  const route = useRoute<RouteProp<VehicleRouteParamList, 'VehiclePhotos'>>();
  const { draft, patchDraft, saveDraftVehicle, isSaving } = useVehicles();
  const [savedVisible, setSavedVisible] = React.useState(false);
  const [savedVehicle, setSavedVehicle] = React.useState<Vehicle | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const returnTo = route.params?.returnTo ?? 'VehicleList';
  const stackOrigin = route.params?.stackOrigin ?? resolveVehicleStackOrigin(navigation);
  const listingTripId = route.params?.listingTripId;

  const handleAddPhotos = (uris: string[]) => {
    setSaveError(null);
    const remaining = Math.max(0, MAX_VEHICLE_PHOTOS - draft.photoUris.length);
    if (remaining === 0) {
      return;
    }
    patchDraft({
      photoUris: [...draft.photoUris, ...uris.slice(0, remaining)],
    });
  };

  const handleSetCoverPhoto = (index: number) => {
    if (index <= 0) {
      return;
    }
    setSaveError(null);
    const next = [...draft.photoUris];
    const [picked] = next.splice(index, 1);
    if (!picked) {
      return;
    }
    next.unshift(picked);
    patchDraft({ photoUris: next });
  };

  const handleRemovePhoto = (index: number) => {
    setSaveError(null);
    patchDraft({ photoUris: draft.photoUris.filter((_, itemIndex) => itemIndex !== index) });
  };

  const handleSubmit = () => {
    if (isSaving) {
      return;
    }

    const cleanedPhotos = draft.photoUris.filter((uri) => uri.length > 0);
    setSaveError(null);
    void saveDraftVehicle({ photoUris: cleanedPhotos })
      .then((vehicle) => {
        if (vehicle) {
          setSavedVehicle(vehicle);
          setSavedVisible(true);
        }
      })
      .catch((error) => {
        setSaveError(getErrorMessage(error, t('vehicles.saveFailed')));
      });
  };

  return (
    <>
      <AuthScaffold
        onBack={() => navigation.goBack()}
        title={t('vehicles.photos.title')}
        subtitle={t('vehicles.photos.subtitle')}
        showLegalFooter={false}
        showLanguageSwitcher={false}
        stepCount={2}
        currentStep={2}
      >
        <VehiclePhotosForm
          photoUris={draft.photoUris}
          onAddPhotos={handleAddPhotos}
          onRemovePhoto={handleRemovePhoto}
          onSetCoverPhoto={handleSetCoverPhoto}
          onSubmit={handleSubmit}
          submitLabel={t('vehicles.photos.cta')}
          submitDisabled={isSaving}
          loading={isSaving}
        />
        {saveError ? <AppText style={styles.errorText}>{saveError}</AppText> : null}
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
              navigateAfterVehicleSave(
                navigation,
                returnTo,
                savedVehicle,
                stackOrigin,
                listingTripId,
              );
            }
          },
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  errorText: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.primary,
    textAlign: 'center',
  },
});
