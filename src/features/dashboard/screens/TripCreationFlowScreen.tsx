import React from 'react';
import { BackHandler, Keyboard } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { CITY_RESULTS_MAX_HEIGHT } from '@/features/dashboard/components/trip/CitySearchField';
import { TripDetailsStep } from '@/features/dashboard/components/trip/TripDetailsStep';
import { TripLuggageStep } from '@/features/dashboard/components/trip/TripLuggageStep';
import { TripPreviewStep } from '@/features/dashboard/components/trip/TripPreviewStep';
import { TripRfqAuctionStep } from '@/features/dashboard/components/trip/TripRfqAuctionStep';
import { TripRouteTypeStep } from '@/features/dashboard/components/trip/TripRouteTypeStep';
import { TripScheduleStep } from '@/features/dashboard/components/trip/TripScheduleStep';
import { TripSeaAirDetailsStep } from '@/features/dashboard/components/trip/TripSeaAirDetailsStep';
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
import {
  isSeaOrAirRoute,
  shouldSkipListingScheduleStep,
  type TripDraft,
  type TripRouteType,
} from '@/features/dashboard/types/trip.types';
import { spacing } from '@/theme';

type TripCreationStep =
  | 'routeType'
  | 'vehicle'
  | 'vehicleMode'
  | 'details'
  | 'luggage'
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

const PASSENGER_LAND_STEP_ORDER: TripCreationStep[] = [
  'routeType',
  'vehicleMode',
  'vehicle',
  'details',
  'listing',
  'schedule',
  'preview',
];

const PASSENGER_SEA_AIR_STEP_ORDER: TripCreationStep[] = [
  'routeType',
  'details',
  'luggage',
  'schedule',
  'preview',
];

function stepOrderForRole(
  isPassenger: boolean,
  vehicleMode: TripDraft['vehicleMode'],
  listingType: TripDraft['listingType'] = null,
  durationHours = 24,
  routeType: TripDraft['routeType'] = null,
): TripCreationStep[] {
  if (!isPassenger) {
    let next = [...DRIVER_STEP_ORDER];
    if (vehicleMode === 'shared') {
      next = next.filter((item) => item !== 'listing');
    }
    if (shouldSkipListingScheduleStep(listingType, durationHours)) {
      next = next.filter((item) => item !== 'schedule');
    }
    return next;
  }

  if (isSeaOrAirRoute(routeType)) {
    return [...PASSENGER_SEA_AIR_STEP_ORDER];
  }

  let next = [...PASSENGER_LAND_STEP_ORDER];
  if (vehicleMode === 'shared') {
    next = next.filter((item) => item !== 'listing');
  }
  if (shouldSkipListingScheduleStep(listingType, durationHours)) {
    next = next.filter((item) => item !== 'schedule');
  }
  return next;
}

function firstStepForRole(isPassenger: boolean): TripCreationStep {
  return stepOrderForRole(isPassenger, null)[0]!;
}

function stepProgress(
  step: TripCreationStep,
  isPassenger: boolean,
  vehicleMode: TripDraft['vehicleMode'],
  listingType: TripDraft['listingType'],
  durationHours: number,
  routeType: TripDraft['routeType'],
): number {
  const order = stepOrderForRole(
    isPassenger,
    vehicleMode,
    listingType,
    durationHours,
    routeType,
  );
  const index = order.indexOf(step);
  return (index >= 0 ? index : 0) + 1;
}

function seaAirDefaults(): Partial<TripDraft> {
  return {
    vehicleMode: 'shared',
    listingType: 'rfq',
    durationHours: 24,
    startMode: null,
    scheduledStartAt: null,
    vehicleClass: null,
    vehicleId: null,
  };
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
    const order = stepOrderForRole(
      isPassenger,
      draft.vehicleMode,
      draft.listingType,
      draft.durationHours,
      draft.routeType,
    );
    const index = order.indexOf(step);
    if (index < order.length - 1) {
      goToStep(order[index + 1]!);
    }
  }, [
    draft.durationHours,
    draft.listingType,
    draft.routeType,
    draft.vehicleMode,
    goToStep,
    isPassenger,
    step,
  ]);

  const goToPreviousStep = React.useCallback(() => {
    const order = stepOrderForRole(
      isPassenger,
      draft.vehicleMode,
      draft.listingType,
      draft.durationHours,
      draft.routeType,
    );
    const index = order.indexOf(step);
    if (index > 0) {
      goToStep(order[index - 1]!);
      return true;
    }
    return false;
  }, [
    draft.durationHours,
    draft.listingType,
    draft.routeType,
    draft.vehicleMode,
    goToStep,
    isPassenger,
    step,
  ]);

  React.useEffect(() => {
    if (!shouldSkipListingScheduleStep(draft.listingType, draft.durationHours)) {
      return;
    }
    if (draft.startMode === 'instant' && draft.scheduledStartAt == null) {
      return;
    }
    patchDraft({ startMode: 'instant', scheduledStartAt: null });
  }, [draft.durationHours, draft.listingType, draft.scheduledStartAt, draft.startMode, patchDraft]);

  React.useEffect(() => {
    if (draft.vehicleMode !== 'shared') {
      return;
    }
    if (draft.listingType === 'rfq' && draft.durationHours === 24) {
      return;
    }
    patchDraft({ listingType: 'rfq', durationHours: 24 });
  }, [draft.durationHours, draft.listingType, draft.vehicleMode, patchDraft]);

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

  const handleRouteTypeChange = (routeType: TripRouteType) => {
    const previous = draft.routeType;
    const switchingKind =
      previous !== routeType &&
      (isSeaOrAirRoute(previous) || isSeaOrAirRoute(routeType));

    if (isSeaOrAirRoute(routeType)) {
      patchDraft({
        routeType,
        ...seaAirDefaults(),
        ...(switchingKind
          ? {
              departureCity: null,
              departurePoint: null,
              arrivalCity: null,
              arrivalPoint: null,
            }
          : {}),
      });
      return;
    }
    patchDraft({
      routeType,
      luggageOption: null,
      luggageType: null,
      luggageLength: '',
      luggageWidth: '',
      luggageWeight: '',
    });
  };

  const header = React.useMemo(() => {
    switch (step) {
      case 'routeType':
        return {
          title: t('trips.create.routeTypeTitle'),
          subtitle: t('trips.create.routeTypeSubtitle'),
        };
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
          subtitle: isSeaOrAirRoute(draft.routeType)
            ? t('trips.create.detailsSeaAirSubtitle')
            : t('trips.create.detailsSubtitle'),
        };
      case 'luggage':
        return {
          title: t('trips.create.luggageTitle'),
          subtitle: t('trips.create.luggageSubtitle'),
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
  }, [draft.routeType, isPassenger, step, t]);

  const selectedVehicle = draft.vehicleId ? getVehicleById(draft.vehicleId) : undefined;
  const currentOrder = stepOrderForRole(
    isPassenger,
    draft.vehicleMode,
    draft.listingType,
    draft.durationHours,
    draft.routeType,
  );

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
        stepCount={currentOrder.length}
        currentStep={stepProgress(
          step,
          isPassenger,
          draft.vehicleMode,
          draft.listingType,
          draft.durationHours,
          draft.routeType,
        )}
        scrollBottomOffset={step === 'details' ? CITY_RESULTS_MAX_HEIGHT + spacing.md : undefined}
      >
        {step === 'routeType' ? (
          <TripRouteTypeStep
            value={draft.routeType}
            onChange={handleRouteTypeChange}
            onContinue={goToNextStep}
          />
        ) : null}

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
          isSeaOrAirRoute(draft.routeType) ? (
            <TripSeaAirDetailsStep draft={draft} onChange={patchDraft} onContinue={goToNextStep} />
          ) : (
            <TripDetailsStep draft={draft} onChange={patchDraft} onContinue={goToNextStep} />
          )
        ) : null}

        {step === 'luggage' ? (
          <TripLuggageStep draft={draft} onChange={patchDraft} onContinue={goToNextStep} />
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
