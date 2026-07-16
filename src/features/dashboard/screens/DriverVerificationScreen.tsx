import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { i18n as appI18n } from '@/i18n';
import { AppDialog } from '@/shared/components/AppDialog';
import { IdentityDocumentVerification } from '@/shared/components/IdentityDocumentVerification';

import { useDashboardSession } from '../context/DashboardSessionContext';
import type { SettingsStackParamList } from '../navigation/settingsTypes';

/**
 * Become-a-driver license verification — same AuthScaffold shell as
 * signup personal verification (NIC), with driving-license copy.
 */
export function DriverVerificationScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const { setRole } = useDashboardSession();

  const [licenseNumber, setLicenseNumber] = React.useState('');
  const [frontUri, setFrontUri] = React.useState<string | null>(null);
  const [backUri, setBackUri] = React.useState<string | null>(null);
  const [savedVisible, setSavedVisible] = React.useState(false);

  const handleSubmit = () => {
    setRole('driver');
    setSavedVisible(true);
  };

  return (
    <>
      <AuthScaffold
        onBack={() => navigation.goBack()}
        title={t('driverVerification.title')}
        subtitle={t('driverVerification.subtitle')}
        showLegalFooter={false}
      >
        <AuthCard>
          <IdentityDocumentVerification
            documentNumber={licenseNumber}
            documentNumberLabel={t('driverVerification.licenseNumber')}
            documentNumberPlaceholder={t('driverVerification.licensePlaceholder')}
            frontUri={frontUri}
            backUri={backUri}
            frontLabel={t('driverVerification.licenseFront')}
            backLabel={t('driverVerification.licenseBack')}
            uploadHint={t('driverVerification.uploadHint')}
            changeHint={t('driverVerification.changeHint')}
            submitLabel={t('driverVerification.cta')}
            onChangeDocumentNumber={setLicenseNumber}
            onChangeFront={setFrontUri}
            onChangeBack={setBackUri}
            onSubmit={handleSubmit}
            keyboardType="default"
          />
        </AuthCard>
      </AuthScaffold>

      <AppDialog
        visible={savedVisible}
        icon="check"
        title={t('driverVerification.successTitle')}
        message={t('driverVerification.successBody')}
        confirmAction={{
          label: t('common.ok'),
          onPress: () => {
            setSavedVisible(false);
            navigation.navigate('SettingsHome');
          },
        }}
      />
    </>
  );
}
