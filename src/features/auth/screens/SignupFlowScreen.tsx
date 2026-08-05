import React from 'react';
import { BackHandler, Keyboard } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { authApi } from '@/services/api/authApi';
import { isApiErrorWithCode } from '@/services/api/apiError';
import { getErrorMessage } from '@/services/api/errorMessage';
import { getDeviceId } from '@/services/deviceId';
import { AppDialog } from '@/shared/components/AppDialog';
import { useAuthStore } from '@/store/authStore';
import { useDevicePrefsStore } from '@/store/devicePrefsStore';
import { useProfileStore } from '@/store/profileStore';
import { useSignupDraftStore } from '@/store/signupDraftStore';

import { AuthScaffold } from '../components/AuthScaffold';
import type { AuthStackParamList } from '../navigation/types';
import { toPhoneIdentity } from '../utils/phone-identity';
import { toSignupSubmitPayload } from '../utils/signup-payload.mapper';
import { formatPhoneDisplay } from '../types/signup.types';
import { SignupDocumentsScreen } from './SignupDocumentsScreen';
import { SignupOtpScreen } from './SignupOtpScreen';
import { SignupPersonalInfoScreen } from './SignupPersonalInfoScreen';
import { SignupPhoneScreen } from './SignupPhoneScreen';
import { SignupSecurityScreen } from './SignupSecurityScreen';

type SignupStep = 'phone' | 'otp' | 'personal' | 'documents' | 'security';

const STEP_ORDER: SignupStep[] = ['phone', 'otp', 'personal', 'documents', 'security'];

/**
 * Progress shown in the header stepper. Phone entry + OTP verification are the
 * same conceptual step, so the flow surfaces 4 steps.
 */
const TOTAL_STEPS = 5;
const STEP_PROGRESS: Record<SignupStep, number> = {
  phone: 1,
  otp: 2,
  personal: 3,
  documents: 4,
  security: 5,
};

type Nav = NativeStackNavigationProp<AuthStackParamList>;

/**
 * One persistent AuthScaffold; only step content swaps (avoids remount jerk).
 */
export function SignupFlowScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { draft, patchDraft } = useSignupDraftStore();
  const [step, setStep] = React.useState<SignupStep>('phone');
  const [otpResentVisible, setOtpResentVisible] = React.useState(false);
  const [skipDocumentsVisible, setSkipDocumentsVisible] = React.useState(false);
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [sendOtpError, setSendOtpError] = React.useState<string | null>(null);
  const [verifyingOtp, setVerifyingOtp] = React.useState(false);
  const [verifyOtpError, setVerifyOtpError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  // Set when we intentionally leave the flow (e.g. finishing signup), so the
  // `beforeRemove` guard below doesn't hijack it into stepping backward.
  const isLeavingRef = React.useRef(false);

  const leaveFlow = React.useCallback(() => {
    Keyboard.dismiss();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Welcome');
    }
  }, [navigation]);

  const goToStep = React.useCallback((next: SignupStep) => {
    Keyboard.dismiss();
    setStep(next);
  }, []);

  const goToPreviousStep = React.useCallback(() => {
    const index = STEP_ORDER.indexOf(step);
    if (index > 0) {
      goToStep(STEP_ORDER[index - 1]!);
      return true;
    }
    return false;
  }, [step, goToStep]);

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
      if (step === 'phone' || isLeavingRef.current) {
        return;
      }
      event.preventDefault();
      goToPreviousStep();
    });
    return unsubscribe;
  }, [navigation, step, goToPreviousStep]);

  const phoneLabel = formatPhoneDisplay(draft.country, draft.phoneDigits);

  const header =
    step === 'phone'
      ? {
          title: t('auth.signup.phone.title'),
          subtitle: t('auth.signup.phone.subtitle'),
        }
      : step === 'otp'
        ? {
            title: t('auth.signup.otp.title'),
            subtitle: t('auth.signup.otp.subtitle', { phone: phoneLabel }),
          }
        : step === 'personal'
          ? {
              title: t('auth.signup.personal.title'),
              subtitle: t('auth.signup.personal.subtitle'),
            }
          : step === 'documents'
            ? {
                title: t('auth.signup.documents.title'),
                subtitle: t('auth.signup.documents.subtitle'),
              }
            : {
                title: t('auth.signup.security.title'),
                subtitle: t('auth.signup.security.subtitle'),
              };

  const onBack = step === 'phone' ? leaveFlow : () => goToPreviousStep();

  const handleSendOtp = async () => {
    setSendOtpError(null);
    setSendingOtp(true);
    try {
      await authApi.sendSignupOtp(toPhoneIdentity(draft.country, draft.phoneDigits));
      goToStep('otp');
    } catch (error) {
      setSendOtpError(
        isApiErrorWithCode(error, 'RATE_LIMITED')
          ? t('auth.otpLimitReached')
          : getErrorMessage(error, t('auth.signup.phone.sendFailed')),
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await authApi.sendSignupOtp(toPhoneIdentity(draft.country, draft.phoneDigits));
      patchDraft({ otp: '' });
      setOtpResentVisible(true);
    } catch (error) {
      setVerifyOtpError(
        isApiErrorWithCode(error, 'RATE_LIMITED')
          ? t('auth.otpLimitReached')
          : getErrorMessage(error, t('auth.signup.otp.resendFailed')),
      );
    }
  };

  const handleVerifyOtp = async (otpOverride?: string) => {
    const otpValue = otpOverride ?? draft.otp;
    setVerifyOtpError(null);
    setVerifyingOtp(true);
    try {
      await authApi.verifySignupOtp(toPhoneIdentity(draft.country, draft.phoneDigits), otpValue);
      goToStep('personal');
    } catch (error) {
      patchDraft({ otp: '' });
      setVerifyOtpError(getErrorMessage(error, t('auth.signup.otp.verifyFailed')));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleFinishSignup = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const deviceId = await getDeviceId();
      const payload = await toSignupSubmitPayload(draft, deviceId);
      const result = await authApi.submitSignup(payload);

      await useAuthStore.getState().setAuthenticated(result.accessToken);
      useProfileStore.getState().setProfile(result.profile);

      const devicePrefs = useDevicePrefsStore.getState();
      await devicePrefs.setLastPhone({
        phoneDigits: draft.phoneDigits,
        countryCode: draft.country.code,
        countryCallingCode: draft.country.callingCode,
      });
      await devicePrefs.setBiometricEnabled(draft.biometricEnabled);
      // Always cache so Face ID can be enabled later from Settings without
      // requiring a second manual login first.
      await devicePrefs.setCachedMpin(draft.mpin);

      Keyboard.dismiss();
      isLeavingRef.current = true;
      navigation.replace('SignupSuccess');
    } catch (error) {
      setSubmitError(getErrorMessage(error, t('auth.signup.security.submitFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AuthScaffold
        onBack={onBack}
        title={header.title}
        subtitle={header.subtitle}
        stepCount={TOTAL_STEPS}
        currentStep={STEP_PROGRESS[step]}
        showLegalFooter={step === 'phone' || step === 'otp'}
      >
        {step === 'phone' ? (
          <SignupPhoneScreen
            country={draft.country}
            phoneDigits={draft.phoneDigits}
            onChangeCountry={(country) => {
              setSendOtpError(null);
              patchDraft({ country });
            }}
            onChangePhone={(phoneDigits) => {
              setSendOtpError(null);
              patchDraft({ phoneDigits });
            }}
            onContinue={() => void handleSendOtp()}
            loading={sendingOtp}
            errorMessage={sendOtpError}
          />
        ) : null}

        {step === 'otp' ? (
          <SignupOtpScreen
            otp={draft.otp}
            onChangeOtp={(otp) => patchDraft({ otp })}
            onContinue={(value) => void handleVerifyOtp(value)}
            onResend={() => void handleResendOtp()}
            loading={verifyingOtp}
            errorMessage={verifyOtpError}
          />
        ) : null}

        {step === 'personal' ? (
          <SignupPersonalInfoScreen
            country={draft.country}
            phoneDigits={draft.phoneDigits}
            fullName={draft.fullName}
            email={draft.email}
            address={draft.address}
            locationCoords={draft.locationCoords}
            profilePhotoUri={draft.profilePhotoUri}
            onChangeFullName={(fullName) => patchDraft({ fullName })}
            onChangeEmail={(email) => patchDraft({ email })}
            onChangeAddress={(address) => patchDraft({ address })}
            onChangeLocationCoords={(locationCoords) => patchDraft({ locationCoords })}
            onChangePhoto={(profilePhotoUri) => patchDraft({ profilePhotoUri })}
            onContinue={() => goToStep('documents')}
          />
        ) : null}

        {step === 'documents' ? (
          <SignupDocumentsScreen
            nicNumber={draft.nicNumber}
            nicFrontUri={draft.nicFrontUri}
            nicBackUri={draft.nicBackUri}
            onChangeNicNumber={(nicNumber) => patchDraft({ nicNumber })}
            onChangeNicFront={(nicFrontUri) => patchDraft({ nicFrontUri })}
            onChangeNicBack={(nicBackUri) => patchDraft({ nicBackUri })}
            onContinue={() => goToStep('security')}
            onSkip={() => setSkipDocumentsVisible(true)}
          />
        ) : null}

        {step === 'security' ? (
          <SignupSecurityScreen
            mpin={draft.mpin}
            mpinConfirm={draft.mpinConfirm}
            biometricEnabled={draft.biometricEnabled}
            onChangeMpin={(mpin) => patchDraft({ mpin })}
            onChangeMpinConfirm={(mpinConfirm) => patchDraft({ mpinConfirm })}
            onChangeBiometric={(biometricEnabled) => patchDraft({ biometricEnabled })}
            onContinue={() => void handleFinishSignup()}
            submitting={submitting}
            errorMessage={submitError}
          />
        ) : null}
      </AuthScaffold>

      <AppDialog
        visible={otpResentVisible}
        icon="check-circle"
        title={t('auth.signup.otp.resentTitle')}
        message={t('auth.signup.otp.resentBody')}
        confirmAction={{
          label: t('auth.signup.otp.resentConfirm'),
          onPress: () => setOtpResentVisible(false),
        }}
      />

      <AppDialog
        visible={skipDocumentsVisible}
        icon="exclamation-triangle"
        title={t('auth.signup.documents.skipConfirmTitle')}
        message={t('auth.signup.documents.skipConfirmBody')}
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => setSkipDocumentsVisible(false),
        }}
        confirmAction={{
          label: t('auth.signup.documents.skipConfirmConfirm'),
          onPress: () => {
            setSkipDocumentsVisible(false);
            goToStep('security');
          },
        }}
      />
    </>
  );
}
