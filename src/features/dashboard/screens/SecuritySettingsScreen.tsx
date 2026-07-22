import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { authApi } from '@/services/api/authApi';
import { SecuritySetupForm } from '@/shared/components/SecuritySetupForm';
import { useDevicePrefsStore } from '@/store/devicePrefsStore';

import { useDashboardSession } from '../context/DashboardSessionContext';

/**
 * Settings → Security.
 * Same shared security form as signup; only AuthScaffold heading differs.
 */
export function SecuritySettingsScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation = useNavigation();
  const { user, setBiometricEnabled } = useDashboardSession();

  const handleSaveMpin = async (currentMpin: string, newMpin: string): Promise<void> => {
    await authApi.changeMpin(currentMpin, newMpin);
    // Keep the biometric-cached MPIN in sync so the next biometric login doesn't
    // silently submit the now-stale value.
    const devicePrefs = useDevicePrefsStore.getState();
    if (devicePrefs.biometricEnabled) {
      await devicePrefs.setCachedMpin(newMpin);
    }
  };

  return (
    <AuthScaffold
      onBack={() => navigation.goBack()}
      title={t('securitySettings.title')}
      subtitle={t('securitySettings.subtitle')}
      showLegalFooter={false}
    >
      <SecuritySetupForm
        mode="manage"
        biometricEnabled={user.biometricEnabled}
        onChangeBiometric={setBiometricEnabled}
        onSaveMpin={handleSaveMpin}
      />
    </AuthScaffold>
  );
}
