import React from 'react';
import { Keyboard } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { useDeviceBiometric } from '@/shared/hooks/useDeviceBiometric';
import { useDevicePrefsStore } from '@/store/devicePrefsStore';

/**
 * Fires the OS biometric prompt once when `enabled` becomes true (the login MPIN step
 * mounting after a fresh OTP verification), if biometric is on for this device and a
 * cached MPIN exists. Success auto-submits the cached MPIN; cancel/fail silently falls
 * back to manual entry — no error shown, per the reference auth spec.
 */
export function useBiometricLogin(options: {
  enabled: boolean;
  onAutoSubmit: (cachedMpin: string) => void;
}): void {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { available } = useDeviceBiometric();
  const biometricEnabled = useDevicePrefsStore((state) => state.biometricEnabled);
  const cachedMpin = useDevicePrefsStore((state) => state.cachedMpin);
  const hasFiredRef = React.useRef(false);
  const onAutoSubmitRef = React.useRef(options.onAutoSubmit);
  onAutoSubmitRef.current = options.onAutoSubmit;

  React.useEffect(() => {
    if (!options.enabled || hasFiredRef.current) {
      return;
    }
    if (!available || !biometricEnabled || !cachedMpin) {
      return;
    }

    hasFiredRef.current = true;
    const mpinToSubmit = cachedMpin;

    void (async () => {
      // Avoid iOS Face ID failing when the MPIN keyboard is still presenting.
      Keyboard.dismiss();
      await new Promise((resolve) => setTimeout(resolve, 250));

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('auth.login.mpin.biometricPrompt'),
        cancelLabel: t('common.cancel'),
      });

      if (result.success) {
        onAutoSubmitRef.current(mpinToSubmit);
      }
    })();
  }, [options.enabled, available, biometricEnabled, cachedMpin, t]);
}
