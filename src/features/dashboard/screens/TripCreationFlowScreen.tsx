import React from 'react';
import { BackHandler, Keyboard, Pressable, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
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
import { TripVehicleModeStep } from '@/features/dashboard/components/trip/TripVehicleModeStep';
import { TripVehicleSelectStep } from '@/features/dashboard/components/trip/TripVehicleSelectStep';
import { useTrips } from '@/features/dashboard/context/TripContext';
import { useVehicles } from '@/features/dashboard/context/VehicleContext';
import type { DashboardRootStackParamList } from '@/features/dashboard/navigation/dashboardRootTypes';
import { exitTripCreation, exitTripCreationToListings } from '@/features/dashboard/navigation/homeStackNavigation';
import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { AppDialog } from '@/shared/components/AppDialog';
import { colors, spacing } from '@/theme';

type TripCreationStep =
  | 'vehicle'
  | 'vehicleMode'
  | 'details'
  | 'listing'
  | 'schedule'
  | 'preview';

const STEP_ORDER: TripCreationStep[] = [
  'vehicle',
  'vehicleMode',
  'details',
  'listing',
  'schedule',
  'preview',
];

const TOTAL_STEPS = STEP_ORDER.length;

const STEP_PROGRESS: Record<TripCreationStep, number> = {
  vehicle: 1,
  vehicleMode: 2,
  details: 3,
  listing: 4,
  schedule: 5,
  preview: 6,
};

type Nav = NativeStackNavigationProp<DashboardRootStackParamList, 'TripCreation'>;

export function TripCreationFlowScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<DashboardRootStackParamList, 'TripCreation'>>();
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { draft, patchDraft, publishDraft, isPublishing } = useTrips();
  const { vehicles, refreshVehicles, getVehicleById, beginAddVehicle } = useVehicles();
  const [step, setStep] = React.useState<TripCreationStep>('vehicle');
  const [successVisible, setSuccessVisible] = React.useState(false);
  const [publishError, setPublishError] = React.useState<string | null>(null);
  const isLeavingRef = React.useRef(false);
  const didReturnFromVehicleRef = React.useRef(false);

  React.useEffect(() => {
    if (route.params?.flowKey === undefined) {
      return;
    }
    setStep('vehicle');
    setSuccessVisible(false);
    isLeavingRef.current = false;
  }, [route.params?.flowKey]);

  React.useEffect(() => {
    const selectVehicleId = route.params?.selectVehicleId;
    if (!selectVehicleId) {
      return;
    }
    // Refresh vehicle list so the newly added vehicle is available in state.
    void refreshVehicles().catch(() => undefined).finally(() => {
      patchDraft({ vehicleId: selectVehicleId });
      setStep('vehicle');
      navigation.setParams({ selectVehicleId: undefined });
    });
  }, [navigation, patchDraft, refreshVehicles, route.params?.selectVehicleId]);

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
    const index = STEP_ORDER.indexOf(step);
    if (index < STEP_ORDER.length - 1) {
      goToStep(STEP_ORDER[index + 1]!);
    }
  }, [goToStep, step]);

  const goToPreviousStep = React.useCallback(() => {
    const index = STEP_ORDER.indexOf(step);
    if (index > 0) {
      goToStep(STEP_ORDER[index - 1]!);
      return true;
    }
    return false;
  }, [goToStep, step]);

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
      if (step === 'vehicle' || isLeavingRef.current) {
        return;
      }
      event.preventDefault();
      goToPreviousStep();
    });
    return unsubscribe;
  }, [navigation, step, goToPreviousStep]);

  const handlePublish = () => {
    if (isPublishing) {
      return;
    }
    setPublishError(null);
    void publishDraft()
      .then((trip) => {
        if (!trip) {
          setPublishError(t('trips.create.publishFailed'));
          return;
        }
        setSuccessVisible(true);
      })
      .catch((error) => {
        setPublishError(getErrorMessage(error, t('trips.create.publishFailed')));
      });
  };

  const handleSuccessDismiss = () => {
    setSuccessVisible(false);
    isLeavingRef.current = true;
    exitTripCreationToListings(navigation);
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
        return {
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
        return {
          title: t('trips.create.previewTitle'),
          subtitle: t('trips.create.previewSubtitle'),
        };
      default:
        return { title: t('trips.create.flowTitle'), subtitle: undefined };
    }
  }, [step, t]);

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
        headerRight={
          step === 'vehicle' ? (
            <Pressable
              onPress={handleAddVehicle}
              style={styles.addButton}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('vehicles.addVehicle')}
            >
              <FontAwesome name="plus" size={16} color={colors.white} />
            </Pressable>
          ) : undefined
        }
        stepCount={TOTAL_STEPS}
        currentStep={STEP_PROGRESS[step]}
        scrollBottomOffset={step === 'details' ? CITY_RESULTS_MAX_HEIGHT + spacing.md : undefined}
      >
        {step === 'vehicle' ? (
          <TripVehicleSelectStep
            vehicles={vehicles}
            selectedVehicleId={draft.vehicleId}
            onSelectVehicle={(vehicleId) => patchDraft({ vehicleId })}
            onContinue={goToNextStep}
            onAddVehicle={handleAddVehicle}
          />
        ) : null}

        {step === 'vehicleMode' ? (
          <TripVehicleModeStep
            value={draft.vehicleMode}
            onChange={(vehicleMode) => patchDraft({ vehicleMode })}
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

      <AppDialog
        visible={successVisible}
        icon="check"
        title={t('trips.create.successTitle')}
        message={t('trips.create.successBody')}
        confirmAction={{
          label: t('common.ok'),
          onPress: handleSuccessDismiss,
        }}
      />
    </>
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
});
