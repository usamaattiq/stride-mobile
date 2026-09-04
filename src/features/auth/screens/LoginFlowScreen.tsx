import React from 'react';
import { BackHandler, Keyboard } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { isAdminPhone } from '@/features/admin/constants/admin-phone';
import { authApi } from '@/services/api/authApi';
import { adminApi } from '@/services/api/adminApi';
import { isApiErrorWithCode } from '@/services/api/apiError';
import { getErrorMessage } from '@/services/api/errorMessage';
import { getDeviceId } from '@/services/deviceId';
import { registerForPushNotifications, unregisterPushNotifications } from '@/services/pushNotifications';
import type { AdminProfile } from '@/services/api/adminApi';
import type { UserProfileDto } from '@/services/api/authApi.types';
import { useAuthStore } from '@/store/authStore';
import { adminStore } from '@/store/adminStore';
import { useDevicePrefsStore } from '@/store/devicePrefsStore';
import { useLoginFlowStore } from '@/store/loginFlowStore';
import { useProfileStore } from '@/store/profileStore';

import { AuthScaffold } from '../components/AuthScaffold';
import { findCountryByCode } from '../constants/countries';
import type { AuthStackParamList } from '../navigation/types';
import { formatPhoneDisplay } from '../types/signup.types';
import { normalizeLocalPhoneDigits, toPhoneIdentity } from '../utils/phone-identity';
import { LoginForgotConfirmMpinScreen } from './LoginForgotConfirmMpinScreen';
import { LoginForgotNewMpinScreen } from './LoginForgotNewMpinScreen';
import { LoginMpinScreen } from './LoginMpinScreen';
import { LoginOtpScreen } from './LoginOtpScreen';
import { LoginPhoneScreen } from './LoginPhoneScreen';

type LoginStep = 'phone' | 'otp' | 'mpin' | 'forgotOtp' | 'forgotNewMpin' | 'forgotConfirmMpin';

const BACK_STEP: Partial<Record<LoginStep, LoginStep>> = {
  otp: 'phone',
  mpin: 'otp',
  forgotOtp: 'mpin',
  forgotNewMpin: 'forgotOtp',
  forgotConfirmMpin: 'forgotNewMpin',
};

type Nav = NativeStackNavigationProp<AuthStackParamList>;

/**
 * One persistent AuthScaffold; only step content swaps (avoids remount jerk).
 */
export function LoginFlowScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const {
    country,
    phoneDigits,
    otp,
    mpin,
    forgotOtp,
    newMpin,
    newMpinConfirm,
    setCountry,
    setPhoneDigits,
    setOtp,
    setMpin,
    setForgotOtp,
    setNewMpin,
    setNewMpinConfirm,
  } = useLoginFlowStore();
  // A device that has completed a full login/signup before jumps straight to the
  // MPIN/biometric step — no phone or OTP entry. Computed once, synchronously, so
  // there's no flash of the phone screen first.
  const [step, setStep] = React.useState<LoginStep>(() =>
    useDevicePrefsStore.getState().lastPhone ? 'mpin' : 'phone',
  );
  const isReturningDeviceRef = React.useRef(step === 'mpin');
  // Set when we intentionally leave the flow (e.g. finishing login), so the
  // `beforeRemove` guard below doesn't hijack it into stepping backward.
  const isLeavingRef = React.useRef(false);

  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [sendOtpError, setSendOtpError] = React.useState<string | null>(null);
  const [verifyingOtp, setVerifyingOtp] = React.useState(false);
  const [verifyOtpError, setVerifyOtpError] = React.useState<string | null>(null);
  const [loggingIn, setLoggingIn] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [verifyingForgotOtp, setVerifyingForgotOtp] = React.useState(false);
  const [forgotOtpError, setForgotOtpError] = React.useState<string | null>(null);
  const [resettingMpin, setResettingMpin] = React.useState(false);
  const [resetMpinError, setResetMpinError] = React.useState<string | null>(null);

  // Pre-fill the last-used phone number on this device, once.
  React.useEffect(() => {
    const lastPhone = useDevicePrefsStore.getState().lastPhone;
    const matchedCountry = lastPhone ? findCountryByCode(lastPhone.countryCode) : undefined;
    if (lastPhone && matchedCountry) {
      setCountry(matchedCountry);
      setPhoneDigits(normalizeLocalPhoneDigits(lastPhone.phoneDigits, matchedCountry.phoneDigitLength));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // A returning device skipped straight to 'mpin' with no 'otp'/'phone' step behind
  // it in this session — back from there leaves the flow instead of stepping into a
  // step that was never actually visited.
  const resolveBackStep = React.useCallback((current: LoginStep): LoginStep | undefined => {
    if (current === 'mpin' && isReturningDeviceRef.current) {
      return undefined;
    }
    return BACK_STEP[current];
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onHardwareBack = () => {
        const previous = resolveBackStep(step);
        if (previous) {
          goToStep(previous);
          return true;
        }
        leaveFlow();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [step, goToStep, leaveFlow, resolveBackStep]),
  );

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (isLeavingRef.current) {
        return;
      }
      const previous = resolveBackStep(step);
      if (!previous) {
        return;
      }
      event.preventDefault();
      goToStep(previous);
    });
    return unsubscribe;
  }, [navigation, step, goToStep, resolveBackStep]);

  const completeLogin = async (accessToken: string, profile: UserProfileDto, usedMpin: string) => {
    await useAuthStore.getState().setAuthenticated(accessToken, 'user');
    useProfileStore.getState().setProfile(profile);

    const devicePrefs = useDevicePrefsStore.getState();
    await devicePrefs.setLastPhone(toPhoneIdentity(country, phoneDigits));
    await devicePrefs.setCachedMpin(usedMpin);
    await devicePrefs.setBiometricEnabled(profile.biometricEnabled);
    void registerForPushNotifications();

    Keyboard.dismiss();
    isLeavingRef.current = true;
    useLoginFlowStore.getState().reset();
    navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
  };

  const completeAdminLogin = async (
    accessToken: string,
    profile: AdminProfile,
    usedMpin: string,
  ) => {
    // Unregister the push token while still on the previous (non-admin) session —
    // the device-tokens route rejects admin tokens as invalid, which would trip
    // sessionRevokedHandler and sign the admin right back out.
    await unregisterPushNotifications();
    await useAuthStore.getState().setAuthenticated(accessToken, 'admin');
    adminStore.setProfile(profile);

    const devicePrefs = useDevicePrefsStore.getState();
    await devicePrefs.setLastPhone(toPhoneIdentity(country, phoneDigits));
    await devicePrefs.setCachedMpin(usedMpin);
    await devicePrefs.setBiometricEnabled(false);

    Keyboard.dismiss();
    isLeavingRef.current = true;
    useLoginFlowStore.getState().reset();
    navigation.reset({ index: 0, routes: [{ name: 'Admin' }] });
  };

  const currentPhoneIdentity = React.useCallback(
    () => toPhoneIdentity(country, phoneDigits),
    [country, phoneDigits],
  );

  const handlePhoneDigitsChange = (digits: string) => {
    setSendOtpError(null);
    setPhoneDigits(digits);
  };

  const handleCountryChange = (next: typeof country) => {
    setSendOtpError(null);
    setCountry(next);
  };

  const handleSendOtp = async () => {
    setSendOtpError(null);
    setSendingOtp(true);
    try {
      const phone = currentPhoneIdentity();
      if (isAdminPhone(phone)) {
        await adminApi.sendLoginOtp(phone);
      } else {
        await authApi.sendLoginOtp(phone, 'login');
      }
      setOtp('');
      goToStep('otp');
    } catch (error) {
      setSendOtpError(
        isApiErrorWithCode(error, 'RATE_LIMITED')
          ? t('auth.otpLimitReached')
          : getErrorMessage(error, t('auth.login.phone.sendOtpFailed')),
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const phone = currentPhoneIdentity();
      if (isAdminPhone(phone)) {
        await adminApi.sendLoginOtp(phone);
      } else {
        await authApi.sendLoginOtp(phone, 'login');
      }
      setOtp('');
    } catch (error) {
      setVerifyOtpError(
        isApiErrorWithCode(error, 'RATE_LIMITED')
          ? t('auth.otpLimitReached')
          : getErrorMessage(error, t('auth.login.otp.resendFailed')),
      );
    }
  };

  const handleVerifyOtp = async (otpOverride?: string) => {
    const otpValue = otpOverride ?? otp;
    setVerifyOtpError(null);
    setVerifyingOtp(true);
    try {
      const phone = currentPhoneIdentity();
      if (isAdminPhone(phone)) {
        await adminApi.verifyLoginOtp(phone, otpValue);
      } else {
        await authApi.verifyLoginOtp(phone, otpValue, 'login');
      }
      setMpin('');
      goToStep('mpin');
    } catch (error) {
      setOtp('');
      setVerifyOtpError(getErrorMessage(error, t('auth.login.otp.verifyFailed')));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleLoginSubmit = async (mpinValue: string) => {
    setLoginError(null);
    setLoggingIn(true);
    try {
      const phone = currentPhoneIdentity();
      if (isAdminPhone(phone)) {
        const result = await adminApi.loginWithMpin(phone, mpinValue);
        await completeAdminLogin(result.accessToken, result.profile, mpinValue);
        return;
      }

      const deviceId = await getDeviceId();
      const result = await authApi.loginWithMpin(phone, mpinValue, deviceId);
      await completeLogin(result.accessToken, result.profile, mpinValue);
    } catch (error) {
      setMpin('');

      // Edge case: this device was expected to skip OTP (devicePrefsStore had a
      // saved phone) but the server disagrees (e.g. app data was cleared without
      // clearing this specific device's session history). Fall back to a normal
      // OTP-gated login instead of leaving the user stuck on a failing MPIN screen.
      if (isReturningDeviceRef.current && isApiErrorWithCode(error, 'VALIDATION_ERROR')) {
        isReturningDeviceRef.current = false;
        setLoginError(null);
        await handleSendOtp();
        return;
      }

      const fallback = isApiErrorWithCode(error, 'ACCOUNT_LOCKED')
        ? t('auth.login.mpin.accountLocked')
        : t('auth.login.mpin.loginFailed');
      setLoginError(getErrorMessage(error, fallback));
    } finally {
      setLoggingIn(false);
    }
  };

  const handleUseDifferentAccount = async () => {
    isReturningDeviceRef.current = false;
    setLoginError(null);
    setMpin('');
    await Promise.all([
      useDevicePrefsStore.getState().clearLastPhone(),
      useDevicePrefsStore.getState().clearCachedMpin(),
    ]);
    useLoginFlowStore.getState().reset();
    goToStep('phone');
  };

  const handleStartForgotMpin = async () => {
    setForgotOtpError(null);
    setLoginError(null);
    try {
      await authApi.sendLoginOtp(toPhoneIdentity(country, phoneDigits), 'mpin_reset');
      setForgotOtp('');
      setNewMpin('');
      setNewMpinConfirm('');
      goToStep('forgotOtp');
    } catch (error) {
      setLoginError(
        isApiErrorWithCode(error, 'RATE_LIMITED')
          ? t('auth.otpLimitReached')
          : getErrorMessage(error, t('auth.login.phone.sendOtpFailed')),
      );
    }
  };

  const handleResendForgotOtp = async () => {
    try {
      await authApi.sendLoginOtp(toPhoneIdentity(country, phoneDigits), 'mpin_reset');
      setForgotOtp('');
    } catch (error) {
      setForgotOtpError(
        isApiErrorWithCode(error, 'RATE_LIMITED')
          ? t('auth.otpLimitReached')
          : getErrorMessage(error, t('auth.login.otp.resendFailed')),
      );
    }
  };

  const handleVerifyForgotOtp = async (otpOverride?: string) => {
    const otpValue = otpOverride ?? forgotOtp;
    setForgotOtpError(null);
    setVerifyingForgotOtp(true);
    try {
      await authApi.verifyLoginOtp(toPhoneIdentity(country, phoneDigits), otpValue, 'mpin_reset');
      goToStep('forgotNewMpin');
    } catch (error) {
      setForgotOtp('');
      setForgotOtpError(getErrorMessage(error, t('auth.login.otp.verifyFailed')));
    } finally {
      setVerifyingForgotOtp(false);
    }
  };

  const handleResetMpin = async () => {
    if (newMpinConfirm !== newMpin) {
      setNewMpinConfirm('');
      setResetMpinError(t('auth.login.forgotMpin.confirmMpin.mismatch'));
      return;
    }

    setResetMpinError(null);
    setResettingMpin(true);
    try {
      const deviceId = await getDeviceId();
      const result = await authApi.resetMpin(toPhoneIdentity(country, phoneDigits), newMpin, deviceId);
      await completeLogin(result.accessToken, result.profile, newMpin);
    } catch (error) {
      setResetMpinError(getErrorMessage(error, t('auth.login.forgotMpin.confirmMpin.resetFailed')));
    } finally {
      setResettingMpin(false);
    }
  };

  const phoneLabel = formatPhoneDisplay(country, phoneDigits);

  const header =
    step === 'phone'
      ? { title: t('auth.login.phone.title'), subtitle: t('auth.login.phone.subtitle') }
      : step === 'otp'
        ? { title: t('auth.login.otp.title'), subtitle: t('auth.login.otp.subtitle', { phone: phoneLabel }) }
        : step === 'mpin'
          ? { title: t('auth.login.mpin.title'), subtitle: t('auth.login.mpin.subtitle') }
          : step === 'forgotOtp'
            ? {
                title: t('auth.login.forgotMpin.otp.title'),
                subtitle: t('auth.login.forgotMpin.otp.subtitle', { phone: phoneLabel }),
              }
            : step === 'forgotNewMpin'
              ? {
                  title: t('auth.login.forgotMpin.newMpin.title'),
                  subtitle: t('auth.login.forgotMpin.newMpin.subtitle'),
                }
              : {
                  title: t('auth.login.forgotMpin.confirmMpin.title'),
                  subtitle: t('auth.login.forgotMpin.confirmMpin.subtitle'),
                };

  const onBack = () => {
    const previous = resolveBackStep(step);
    if (previous) {
      goToStep(previous);
    } else {
      leaveFlow();
    }
  };

  return (
    <AuthScaffold
      onBack={onBack}
      title={header.title}
      subtitle={header.subtitle}
      showLegalFooter={step === 'phone'}
    >
      {step === 'phone' ? (
        <LoginPhoneScreen
          country={country}
          phoneDigits={phoneDigits}
          onChangeCountry={handleCountryChange}
          onChangePhone={handlePhoneDigitsChange}
          onContinue={() => void handleSendOtp()}
          loading={sendingOtp}
          errorMessage={sendOtpError}
        />
      ) : null}

      {step === 'otp' ? (
        <LoginOtpScreen
          otp={otp}
          onChangeOtp={setOtp}
          onContinue={(value) => void handleVerifyOtp(value)}
          onResend={() => void handleResendOtp()}
          loading={verifyingOtp}
          errorMessage={verifyOtpError}
        />
      ) : null}

      {step === 'mpin' ? (
        <LoginMpinScreen
          mpin={mpin}
          onChangeMpin={setMpin}
          onSubmit={(value) => void handleLoginSubmit(value)}
          onForgotMpin={() => void handleStartForgotMpin()}
          loading={loggingIn}
          errorMessage={loginError}
          phoneLabel={isReturningDeviceRef.current ? phoneLabel : undefined}
          onUseDifferentAccount={
            isReturningDeviceRef.current ? () => void handleUseDifferentAccount() : undefined
          }
        />
      ) : null}

      {step === 'forgotOtp' ? (
        <LoginOtpScreen
          otp={forgotOtp}
          onChangeOtp={setForgotOtp}
          onContinue={(value) => void handleVerifyForgotOtp(value)}
          onResend={() => void handleResendForgotOtp()}
          loading={verifyingForgotOtp}
          errorMessage={forgotOtpError}
        />
      ) : null}

      {step === 'forgotNewMpin' ? (
        <LoginForgotNewMpinScreen
          mpin={newMpin}
          onChangeMpin={setNewMpin}
          onContinue={() => goToStep('forgotConfirmMpin')}
        />
      ) : null}

      {step === 'forgotConfirmMpin' ? (
        <LoginForgotConfirmMpinScreen
          mpinConfirm={newMpinConfirm}
          onChangeMpinConfirm={setNewMpinConfirm}
          onContinue={() => void handleResetMpin()}
          loading={resettingMpin}
          errorMessage={resetMpinError}
        />
      ) : null}
    </AuthScaffold>
  );
}
