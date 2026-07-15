import React from 'react';
import { BackHandler, Keyboard } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';

import { AuthScaffold } from '../components/AuthScaffold';
import { useSignupDraft } from '../context/SignupDraftContext';
import type { AuthStackParamList } from '../navigation/types';
import { LoginMpinScreen } from './LoginMpinScreen';
import { LoginPhoneScreen } from './LoginPhoneScreen';

type LoginStep = 'phone' | 'mpin';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

/**
 * One persistent AuthScaffold; only step content swaps (avoids remount jerk).
 */
export function LoginFlowScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { draft, patchDraft, loginMpin, setLoginMpin } = useSignupDraft();
  const [step, setStep] = React.useState<LoginStep>('phone');

  const leaveFlow = React.useCallback(() => {
    Keyboard.dismiss();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Welcome');
    }
  }, [navigation]);

  const goToStep = React.useCallback((next: LoginStep) => {
    Keyboard.dismiss();
    setStep(next);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onHardwareBack = () => {
        if (step === 'mpin') {
          goToStep('phone');
          return true;
        }
        leaveFlow();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [step, goToStep, leaveFlow]),
  );

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (step === 'phone') {
        return;
      }
      event.preventDefault();
      goToStep('phone');
    });
    return unsubscribe;
  }, [navigation, step, goToStep]);

  const header =
    step === 'phone'
      ? {
          title: t('auth.login.phone.title'),
          subtitle: t('auth.login.phone.subtitle'),
        }
      : {
          title: t('auth.login.mpin.title'),
          subtitle: t('auth.login.mpin.subtitle'),
        };

  return (
    <AuthScaffold
      onBack={step === 'phone' ? leaveFlow : () => goToStep('phone')}
      title={header.title}
      subtitle={header.subtitle}
      showLegalFooter={step === 'phone'}
    >
      {step === 'phone' ? (
        <LoginPhoneScreen
          country={draft.country}
          phoneDigits={draft.phoneDigits}
          onChangeCountry={(country) => patchDraft({ country })}
          onChangePhone={(phoneDigits) => patchDraft({ phoneDigits })}
          onContinue={() => {
            setLoginMpin('');
            goToStep('mpin');
          }}
        />
      ) : (
        <LoginMpinScreen
          mpin={loginMpin}
          onChangeMpin={setLoginMpin}
          onContinue={() => {
            Keyboard.dismiss();
            navigation.replace('HomePlaceholder');
          }}
          biometricEnabled={draft.biometricEnabled}
        />
      )}
    </AuthScaffold>
  );
}
