import React from 'react';
import { BackHandler, Keyboard } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { CITY_RESULTS_MAX_HEIGHT } from '@/features/dashboard/components/trip/CitySearchField';
import { TripDetailsStep } from '@/features/dashboard/components/trip/TripDetailsStep';
import { TripPreviewStep } from '@/features/dashboard/components/trip/TripPreviewStep';
import { TripRfqAuctionStep } from '@/features/dashboard/components/trip/TripRfqAuctionStep';
import { TripScheduleStep } from '@/features/dashboard/components/trip/TripScheduleStep';
import { TripVehicleClassStep } from '@/features/dashboard/components/trip/TripVehicleClassStep';
import { TripVehicleModeStep } from '@/features/dashboard/components/trip/TripVehicleModeStep';
import { TripVehicleSelectStep } from '@/features/dashboard/components/trip/TripVehicleSelectStep';
import { useDashboardSession } from '@/features/dashboard/context/DashboardSessionContext';
import { useTrips } from '@/features/dashboard/context/TripContext';
import { useVehicles } from '@/features/dashboard/context/VehicleContext';
import type { DashboardRootStackParamList } from '@/features/dashboard/navigation/dashboardRootTypes';
import { exitTripCreation } from '@/features/dashboard/navigation/homeStackNavigation';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import type { TripDraft } from '@/features/dashboard/types/trip.types';
import { spacing } from '@/theme';

type TripCreationStep =
  | 'vehicle'
  | 'vehicleMode'
  | 'details'
  | 'listing'
  | 'schedule'
  | 'preview';

const DRIVER_STEP_ORDER: TripCreationStep[] = [
  'vehicle',
  'vehicleMode',
  'details',
  'listing',
  'schedule',
  'preview',
];

/** Passengers pick shared vs private first, then vehicle class (SUV, sedan, …). */
const PASSENGER_STEP_ORDER: TripCreationStep[] = [
  'vehicleMode',
  'vehicle',
  'details',
  'listing',
  'schedule',
  'preview',
];

function stepOrderForRole(
  isPassenger: boolean,
  vehicleMode: TripDraft['vehicleMode'],
): TripCreationStep[] {
  const order = isPassenger ? [...PASSENGER_STEP_ORDER] : [...DRIVER_STEP_ORDER];
  if (vehicleMode === 'shared') {
    return order.filter((item) => item !== 'listing');
  }
  return order;
}

function firstStepForRole(isPassenger: boolean): TripCreationStep {
  return stepOrderForRole(isPassenger, null)[0]!;
}

function stepProgress(
  step: TripCreationStep,
  isPassenger: boolean,
  vehicleMode: TripDraft['vehicleMode'],
): number {
  const order = stepOrderForRole(isPassenger, vehicleMode);
  const index = order.indexOf(step);
  return (index >= 0 ? index : 0) + 1;
}

type Nav = NativeStackNavigationProp<DashboardRootStackParamList, 'TripCreation'>;

export function TripCreationFlowScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<DashboardRootStackParamList, 'TripCreation'>>();
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { user } = useDashboardSession();
  const isPassenger = user.role === 'passenger';
  const { draft, patchDraft, publishDraft, isPublishing } = useTrips();
  const { vehicles, isLoading: isLoadingVehicles, loadError: vehiclesLoadError, refreshVehicles, getVehicleById, beginAddVehicle } =
    useVehicles();
  const [step, setStep] = React.useState<TripCreationStep>(() => firstStepForRole(isPassenger));
  const [publishError, setPublishError] = React.useState<string | null>(null);
  const isLeavingRef = React.useRef(false);
  const didReturnFromVehicleRef = React.useRef(false);

  React.useEffect(() => {
    if (route.params?.flowKey === undefined) {
      return;
    }
    setStep(firstStepForRole(isPassenger));
    isLeavingRef.current = false;
    if (!isPassenger) {
      void refreshVehicles().catch(() => undefined);
    }
  }, [route.params?.flowKey, isPassenger, refreshVehicles]);

  useFocusEffect(
    React.useCallback(() => {
      if (isPassenger) {
        return;
      }
      void refreshVehicles().catch(() => undefined);
    }, [isPassenger, refreshVehicles]),
  );

  React.useEffect(() => {
    const selectVehicleId = route.params?.selectVehicleId;
    if (!selectVehicleId || isPassenger) {
      return;
    }
    // Refresh vehicle list so the newly added vehicle is available in state.
    void refreshVehicles().catch(() => undefined).finally(() => {
      patchDraft({ vehicleId: selectVehicleId, vehicleClass: null });
      setStep('vehicleMode');
      navigation.setParams({ selectVehicleId: undefined });
    });
  }, [isPassenger, navigation, patchDraft, refreshVehicles, route.params?.selectVehicleId]);

  const leaveFlow = React.useCallback(() => {
    Keyboard.dismiss();
    isLeavingRef.current = true;
    exitTripCreation(navigation);
  }, [navigation]);

  const goToStep = React.useCallback((next: TripCreationStep) => {
    Keyboard.dismiss();
    setStep(next);
  }, []);

  const goToNextStep = React.useCallback(() => {
    const order = stepOrderForRole(isPassenger, draft.vehicleMode);
    const index = order.indexOf(step);
    if (index < order.length - 1) {
      goToStep(order[index + 1]!);
    }
  }, [draft.vehicleMode, goToStep, isPassenger, step]);

  const goToPreviousStep = React.useCallback(() => {
    const order = stepOrderForRole(isPassenger, draft.vehicleMode);
    const index = order.indexOf(step);
    if (index > 0) {
      goToStep(order[index - 1]!);
      return true;
    }
    return false;
  }, [draft.vehicleMode, goToStep, isPassenger, step]);

  useFocusEffect(
    React.useCallback(() => {
      const onHardwareBack = () => {
        if (goToPreviousStep()) {
          return true;
        }
        leaveFlow();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [goToPreviousStep, leaveFlow]),
  );

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (step === firstStepForRole(isPassenger) || isLeavingRef.current) {
        return;
      }
      event.preventDefault();
      goToPreviousStep();
    });
    return unsubscribe;
  }, [navigation, step, goToPreviousStep, isPassenger]);

  const handlePublish = () => {
    if (isPublishing) {
      return;
    }
    setPublishError(null);
    void publishDraft()
      .then((trip) => {
        if (!trip) {
          setPublishError(
            t(isPassenger ? 'trips.create.publishRequestFailed' : 'trips.create.publishFailed'),
          );
          return;
        }
        isLeavingRef.current = true;
        navigation.reset({
          index: 0,
          routes: [{ name: 'TripPublishSuccess' }],
        });
      })
      .catch((error) => {
        setPublishError(
          getErrorMessage(
            error,
            t(isPassenger ? 'trips.create.publishRequestFailed' : 'trips.create.publishFailed'),
          ),
        );
      });
  };

  const handleAddVehicle = () => {
    didReturnFromVehicleRef.current = true;
    beginAddVehicle();
    navigation.navigate('VehicleDetails', {
      mode: 'add',
      returnTo: 'TripCreation',
      stackOrigin: 'trip',
    });
  };

  const header = React.useMemo(() => {
    switch (step) {
      case 'vehicle':
        return isPassenger
          ? {
              title: t('trips.create.vehicleClassTitle'),
              subtitle: t('trips.create.vehicleClassSubtitle'),
            }
          : {
              title: t('trips.create.vehicleTitle'),
              subtitle: t('trips.create.vehicleSubtitle'),
            };
      case 'vehicleMode':
        return {
          title: t('trips.create.vehicleModeTitle'),
          subtitle: t('trips.create.vehicleModeSubtitle'),
        };
      case 'details':
        return {
          title: t('trips.create.detailsTitle'),
          subtitle: t('trips.create.detailsSubtitle'),
        };
      case 'listing':
        return {
          title: t('trips.create.listingTitle'),
          subtitle: t('trips.create.listingSubtitle'),
        };
      case 'schedule':
        return {
          title: t('trips.create.scheduleTitle'),
          subtitle: t('trips.create.scheduleSubtitle'),
        };
      case 'preview':
        return isPassenger
          ? {
              title: t('trips.create.previewRequestTitle'),
              subtitle: t('trips.create.previewRequestSubtitle'),
            }
          : {
              title: t('trips.create.previewTitle'),
              subtitle: t('trips.create.previewSubtitle'),
            };
      default:
        return { title: t('trips.create.flowTitle'), subtitle: undefined };
    }
  }, [isPassenger, step, t]);

  const selectedVehicle = draft.vehicleId ? getVehicleById(draft.vehicleId) : undefined;

  return (
    <>
      <AuthScaffold
        onBack={() => {
          if (!goToPreviousStep()) {
            leaveFlow();
          }
        }}
        title={header.title}
        subtitle={header.subtitle}
        showLegalFooter={false}
        showLanguageSwitcher={false}
        stepCount={stepOrderForRole(isPassenger, draft.vehicleMode).length}
        currentStep={stepProgress(step, isPassenger, draft.vehicleMode)}
        scrollBottomOffset={step === 'details' ? CITY_RESULTS_MAX_HEIGHT + spacing.md : undefined}
      >
        {step === 'vehicle' ? (
          isPassenger ? (
            <TripVehicleClassStep
              value={draft.vehicleClass}
              onChange={(vehicleClass) => {
                patchDraft({ vehicleClass, vehicleId: null });
              }}
              onContinue={goToNextStep}
            />
          ) : (
            <TripVehicleSelectStep
              vehicles={vehicles}
              isLoading={isLoadingVehicles}
              loadError={vehiclesLoadError}
              onRetry={() => void refreshVehicles().catch(() => undefined)}
              selectedVehicleId={draft.vehicleId}
              onSelectVehicle={(vehicleId) => {
                patchDraft({ vehicleId, vehicleClass: null });
                goToNextStep();
              }}
              onAddVehicle={handleAddVehicle}
            />
          )
        ) : null}

        {step === 'vehicleMode' ? (
          <TripVehicleModeStep
            value={draft.vehicleMode}
            onChange={(vehicleMode) =>
              patchDraft({
                vehicleMode,
                ...(vehicleMode === 'shared'
                  ? { listingType: 'rfq', durationHours: 24 }
                  : {}),
              })
            }
            onContinue={goToNextStep}
          />
        ) : null}

        {step === 'details' ? (
          <TripDetailsStep draft={draft} onChange={patchDraft} onContinue={goToNextStep} />
        ) : null}

        {step === 'listing' ? (
          <TripRfqAuctionStep draft={draft} onChange={patchDraft} onContinue={goToNextStep} />
        ) : null}

        {step === 'schedule' ? (
          <TripScheduleStep draft={draft} onChange={patchDraft} onContinue={goToNextStep} />
        ) : null}

        {step === 'preview' ? (
          <TripPreviewStep
            draft={draft}
            vehicle={selectedVehicle}
            onPublish={handlePublish}
            onEditStep={goToStep}
            publishing={isPublishing}
            errorMessage={publishError}
          />
        ) : null}
      </AuthScaffold>
    </>
  );
}
