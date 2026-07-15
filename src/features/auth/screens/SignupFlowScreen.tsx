import React from 'react';
import { Alert, BackHandler, Keyboard } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';

import { AuthScaffold } from '../components/AuthScaffold';
import { useSignupDraft } from '../context/SignupDraftContext';
import type { AuthStackParamList } from '../navigation/types';
import { formatPhoneDisplay } from '../types/signup.types';
import { SignupDocumentsScreen } from './SignupDocumentsScreen';
import { SignupOtpScreen } from './SignupOtpScreen';
import { SignupPersonalInfoScreen } from './SignupPersonalInfoScreen';
import { SignupPhoneScreen } from './SignupPhoneScreen';
import { SignupSecurityScreen } from './SignupSecurityScreen';

type SignupStep = 'phone' | 'otp' | 'personal' | 'documents' | 'security';

const STEP_ORDER: SignupStep[] = ['phone', 'otp', 'personal', 'documents', 'security'];

type Nav = NativeStackNavigationProp<AuthStackParamList>;

/**
 * One persistent AuthScaffold; only step content swaps (avoids remount jerk).
 */
export function SignupFlowScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { draft, patchDraft } = useSignupDraft();
  const [step, setStep] = React.useState<SignupStep>('phone');

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
      if (step === 'phone') {
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

  return (
    <AuthScaffold onBack={onBack} title={header.title} subtitle={header.subtitle}>
      {step === 'phone' ? (
        <SignupPhoneScreen
          country={draft.country}
          phoneDigits={draft.phoneDigits}
          onChangeCountry={(country) => patchDraft({ country })}
          onChangePhone={(phoneDigits) => patchDraft({ phoneDigits })}
          onContinue={() => goToStep('otp')}
        />
      ) : null}

      {step === 'otp' ? (
        <SignupOtpScreen
          otp={draft.otp}
          onChangeOtp={(otp) => patchDraft({ otp })}
          onContinue={() => goToStep('personal')}
          onResend={() => {
            patchDraft({ otp: '' });
            Alert.alert('OTP resent', 'A new code was sent (demo).');
          }}
        />
      ) : null}

      {step === 'personal' ? (
        <SignupPersonalInfoScreen
          country={draft.country}
          phoneDigits={draft.phoneDigits}
          fullName={draft.fullName}
          email={draft.email}
          address={draft.address}
          profilePhotoUri={draft.profilePhotoUri}
          onChangeFullName={(fullName) => patchDraft({ fullName })}
          onChangeEmail={(email) => patchDraft({ email })}
          onChangeAddress={(address) => patchDraft({ address })}
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
          onContinue={() => {
            Keyboard.dismiss();
            navigation.replace('HomePlaceholder');
          }}
        />
      ) : null}
    </AuthScaffold>
  );
}
