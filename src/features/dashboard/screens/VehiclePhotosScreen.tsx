import React from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
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

function photosUnchanged(current: string[], initial: string[]): boolean {
  if (current.length !== initial.length) {
    return false;
  }
  return current.every((uri, index) => uri === initial[index]);
}

function navigateAfterVehicleSave(
  navigation: NativeStackNavigationProp<VehicleRouteParamList, 'VehiclePhotos'>,
  returnTo: VehicleFlowReturnTo,
  savedVehicle: Vehicle,
  stackOrigin: VehicleStackOrigin,
  listingTripId?: string,
): void {
  completeVehicleFlow(navigation, stackOrigin === 'vehicles' ? 'VehicleView' : returnTo, {
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
  const { draft, patchDraft, saveDraftVehicle, isSaving, clearDraft } = useVehicles();
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const initialPhotoUrisRef = React.useRef(draft.photoUris);

  const returnTo = route.params?.returnTo ?? 'VehicleList';
  const stackOrigin = route.params?.stackOrigin ?? resolveVehicleStackOrigin(navigation);
  const listingTripId = route.params?.listingTripId;

  const cleanedPhotos = draft.photoUris.filter((uri) => uri.length > 0);
  const photosDirty = !photosUnchanged(cleanedPhotos, initialPhotoUrisRef.current);
  const canSave = cleanedPhotos.length > 0 && (!draft.id || photosDirty);

  const handleAddPhotos = (uris: string[]) => {
    setSaveError(null);
    patchDraft((current) => {
      const remaining = Math.max(0, MAX_VEHICLE_PHOTOS - current.photoUris.length);
      if (remaining === 0) {
        return {};
      }
      const added = uris.slice(0, remaining);
      const display = current.photoDisplayUris ?? current.photoUris;
      return {
        photoUris: [...current.photoUris, ...added],
        photoDisplayUris: [...display, ...added],
      };
    });
  };

  const handleSetCoverPhoto = (index: number) => {
    if (index <= 0) {
      return;
    }
    setSaveError(null);
    patchDraft((current) => {
      const next = [...current.photoUris];
      const [picked] = next.splice(index, 1);
      if (!picked) {
        return {};
      }
      next.unshift(picked);
      const display = [...(current.photoDisplayUris ?? current.photoUris)];
      if (display.length === current.photoUris.length) {
        const [displayPicked] = display.splice(index, 1);
        if (displayPicked) {
          display.unshift(displayPicked);
        }
      }
      return { photoUris: next, photoDisplayUris: display };
    });
  };

  const handleRemovePhoto = (index: number) => {
    setSaveError(null);
    patchDraft((current) => {
      const display = current.photoDisplayUris ?? current.photoUris;
      return {
        photoUris: current.photoUris.filter((_, itemIndex) => itemIndex !== index),
        photoDisplayUris: display.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const handleSubmit = () => {
    if (isSaving || !canSave) {
      return;
    }

    setSaveError(null);
    void saveDraftVehicle({
      photoUris: cleanedPhotos,
      photoDisplayUris: (draft.photoDisplayUris ?? draft.photoUris).filter(
        (uri) => uri.length > 0,
      ),
    })
      .then((vehicle) => {
        if (!vehicle) {
          return;
        }
        clearDraft();
        navigateAfterVehicleSave(
          navigation,
          returnTo,
          vehicle,
          stackOrigin,
          listingTripId,
        );
      })
      .catch((error) => {
        setSaveError(getErrorMessage(error, t('vehicles.saveFailed')));
      });
  };

  return (
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
        photoUris={
          draft.photoDisplayUris?.length ? draft.photoDisplayUris : draft.photoUris
        }
        onAddPhotos={handleAddPhotos}
        onRemovePhoto={handleRemovePhoto}
        onSetCoverPhoto={handleSetCoverPhoto}
        onSubmit={handleSubmit}
        submitLabel={t('vehicles.photos.cta')}
        submitDisabled={isSaving || !canSave}
        loading={isSaving}
      />
      {saveError ? <AppText style={styles.errorText}>{saveError}</AppText> : null}
    </AuthScaffold>
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
