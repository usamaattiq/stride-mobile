import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';

import type { AuthStackParamList } from '@/features/auth/navigation/types';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ApiError } from '@/services/api/apiError';
import { authApi } from '@/services/api/authApi';
import type { AccountDeletionBlockReason } from '@/services/api/authApi.types';
import { getErrorMessage } from '@/services/api/errorMessage';
import { unregisterPushNotifications } from '@/services/pushNotifications';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { LanguageSwitcherModal } from '@/shared/components/language-switcher/LanguageSwitcherModal';
import { getLanguageOptions } from '@/shared/components/language-switcher/options';
import type { LanguageOption } from '@/shared/components/language-switcher/types/language-switcher.types';
import { useLegalDocumentSheets } from '@/shared/hooks/useLegalDocumentSheets';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { useSignupDraftStore } from '@/store/signupDraftStore';
import { colors, spacing } from '@/theme';

import { SettingsMenuSectionCard } from '../components/SettingsMenuSectionCard';
import { SettingsProfileHeader } from '../components/SettingsProfileHeader';
import {
  getSettingsSectionsForRole,
  type SettingsMenuItem,
} from '../constants/settingsMenu';
import { useDashboardSession } from '../context/DashboardSessionContext';
import type { DashboardRootStackParamList } from '../navigation/dashboardRootTypes';
import type { DashboardTabParamList } from '../navigation/types';
import type { SettingsStackParamList } from '../navigation/settingsTypes';

type DialogKind = 'passenger' | 'driver' | 'logout' | 'photo' | 'delete-account' | null;

type DeleteEligibilityState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  canDelete: boolean;
  reasons: AccountDeletionBlockReason[];
};

const INITIAL_DELETE_ELIGIBILITY: DeleteEligibilityState = {
  status: 'idle',
  canDelete: false,
  reasons: [],
};

function deletionBlockMessageKey(
  reasons: AccountDeletionBlockReason[],
): 'profile.account.deleteAccount.blockedBoth'
  | 'profile.account.deleteAccount.blockedOwner'
  | 'profile.account.deleteAccount.blockedSender'
  | 'profile.account.deleteAccount.blockedGeneric' {
  const hasOwner = reasons.includes('owner_open_listing');
  const hasSender = reasons.includes('active_offer_or_bid');
  if (hasOwner && hasSender) {
    return 'profile.account.deleteAccount.blockedBoth';
  }
  if (hasOwner) {
    return 'profile.account.deleteAccount.blockedOwner';
  }
  if (hasSender) {
    return 'profile.account.deleteAccount.blockedSender';
  }
  return 'profile.account.deleteAccount.blockedGeneric';
}

type SettingsNav = CompositeNavigationProp<
  NativeStackNavigationProp<SettingsStackParamList>,
  BottomTabNavigationProp<DashboardTabParamList>
>;

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.4';

export function SettingsHomeScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const insets = useSafeAreaInsets();
  const legal = useLegalDocumentSheets();
  const { currentLanguage, setLanguage } = useLanguage();
  const {
    user,
    hasDriverVerification,
    switchToDriver,
    switchToPassenger,
    resetSession,
  } = useDashboardSession();
  const { resetDraft } = useSignupDraftStore();
  const navigation = useNavigation<SettingsNav>();
  const dashboardRootNavigation = navigation.getParent()?.getParent() as
    | NativeStackNavigationProp<DashboardRootStackParamList>
    | undefined;
  const authRootNavigation = dashboardRootNavigation?.getParent() as
    | NativeStackNavigationProp<AuthStackParamList>
    | undefined;

  const [languageModalVisible, setLanguageModalVisible] = React.useState(false);
  const [dialog, setDialog] = React.useState<DialogKind>(null);
  const [switchingRole, setSwitchingRole] = React.useState(false);
  const [switchRoleError, setSwitchRoleError] = React.useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = React.useState(false);
  const [deleteAccountError, setDeleteAccountError] = React.useState<string | null>(null);
  const [deleteEligibility, setDeleteEligibility] = React.useState<DeleteEligibilityState>(
    INITIAL_DELETE_ELIGIBILITY,
  );
  const deleteEligibilityRequestId = React.useRef(0);

  const deleteDialogMessage = React.useMemo(() => {
    if (deleteAccountError) {
      return deleteAccountError;
    }
    if (deleteEligibility.status === 'loading') {
      return t('profile.account.deleteAccount.checking');
    }
    if (deleteEligibility.status === 'error') {
      return t('profile.account.deleteAccount.failed');
    }
    if (deleteEligibility.canDelete) {
      return t('profile.account.deleteAccount.confirm');
    }
    return t(deletionBlockMessageKey(deleteEligibility.reasons));
  }, [deleteAccountError, deleteEligibility, t]);

  const languageOptions = React.useMemo(() => getLanguageOptions(t), [t]);
  const currentLanguageLabel = React.useMemo(
    () =>
      languageOptions.find((option) => option.code === currentLanguage)?.label ??
      t('language.english'),
    [currentLanguage, languageOptions, t],
  );

  const sections = React.useMemo(
    () =>
      getSettingsSectionsForRole({
        role: user.role,
        hasDriverVerification,
      }),
    [user.role, hasDriverVerification],
  );

  const isIdentityComplete =
    user.role === 'driver'
      ? user.isVerified && hasDriverVerification
      : user.isVerified;

  const handleVerifyPress = () => {
    if (user.role === 'driver') {
      if (!user.isVerified) {
        navigation.navigate('NicVerification');
        return;
      }
      if (!hasDriverVerification) {
        navigation.navigate('DriverVerification', { purpose: 'complete' });
      }
      return;
    }

    if (!user.isVerified) {
      navigation.navigate('NicVerification');
    }
  };

  const handleSelectLanguage = (code: LanguageOption['code']) => {
    void setLanguage(code);
    setLanguageModalVisible(false);
  };

  const handleLogout = () => {
    setDialog(null);
    void (async () => {
      await unregisterPushNotifications();
      await authApi.logout().catch(() => undefined);
      await useAuthStore.getState().signOut();
      useProfileStore.getState().clearProfile();
      resetDraft();
      resetSession();
      authRootNavigation?.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    })();
  };

  const closeDeleteDialog = () => {
    if (deletingAccount) {
      return;
    }
    deleteEligibilityRequestId.current += 1;
    setDialog(null);
    setDeleteAccountError(null);
    setDeleteEligibility(INITIAL_DELETE_ELIGIBILITY);
  };

  const openDeleteDialog = () => {
    const requestId = deleteEligibilityRequestId.current + 1;
    deleteEligibilityRequestId.current = requestId;
    setDeleteAccountError(null);
    setDeleteEligibility({ status: 'loading', canDelete: false, reasons: [] });
    setDialog('delete-account');
    void authApi
      .getDeletionEligibility()
      .then((result) => {
        if (deleteEligibilityRequestId.current !== requestId) {
          return;
        }
        setDeleteEligibility({
          status: 'ready',
          canDelete: result.canDelete,
          reasons: result.reasons,
        });
      })
      .catch(() => {
        if (deleteEligibilityRequestId.current !== requestId) {
          return;
        }
        setDeleteEligibility({ status: 'error', canDelete: false, reasons: [] });
      });
  };

  const handleDeleteAccount = () => {
    if (deletingAccount || !deleteEligibility.canDelete) {
      return;
    }

    setDeletingAccount(true);
    setDeleteAccountError(null);
    void (async () => {
      try {
        await unregisterPushNotifications();
        await authApi.deleteAccount();
        await useAuthStore.getState().signOut();
        useProfileStore.getState().clearProfile();
        resetDraft();
        resetSession();
        setDialog(null);
        setDeleteEligibility(INITIAL_DELETE_ELIGIBILITY);
        authRootNavigation?.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      } catch (error) {
        if (error instanceof ApiError && error.code === 'ACCOUNT_DELETION_BLOCKED') {
          const details = error.details as { reasons?: AccountDeletionBlockReason[] } | undefined;
          const reasons = Array.isArray(details?.reasons) ? details.reasons : [];
          setDeleteEligibility({ status: 'ready', canDelete: false, reasons });
          setDeleteAccountError(null);
        } else {
          setDeleteAccountError(
            getErrorMessage(error, t('profile.account.deleteAccount.failed')),
          );
        }
      } finally {
        setDeletingAccount(false);
      }
    })();
  };

  const closeRoleDialog = () => {
    if (switchingRole) {
      return;
    }
    setDialog(null);
    setSwitchRoleError(null);
  };

  const handleSwitchToPassenger = () => {
    if (switchingRole) {
      return;
    }

    setSwitchingRole(true);
    setSwitchRoleError(null);
    void switchToPassenger()
      .then(() => {
        setDialog(null);
      })
      .catch((error) => {
        setSwitchRoleError(
          getErrorMessage(error, t('profile.account.switchPassenger.failed')),
        );
      })
      .finally(() => {
        setSwitchingRole(false);
      });
  };

  const handleSwitchToDriver = () => {
    if (switchingRole) {
      return;
    }

    setSwitchingRole(true);
    setSwitchRoleError(null);
    void switchToDriver()
      .then(() => {
        setDialog(null);
      })
      .catch((error) => {
        setSwitchRoleError(
          getErrorMessage(error, t('profile.account.switchDriver.failed')),
        );
      })
      .finally(() => {
        setSwitchingRole(false);
      });
  };

  const handleMenuPress = (item: SettingsMenuItem): void => {
    switch (item.action) {
      case 'language':
        setLanguageModalVisible(true);
        break;
      case 'terms':
        legal.openTerms();
        break;
      case 'privacy':
        legal.openPrivacy();
        break;
      case 'security':
        navigation.navigate('SecuritySettings');
        break;
      case 'general-info':
        navigation.navigate('GeneralInformation');
        break;
      case 'become-driver':
        navigation.navigate('DriverVerification', { purpose: 'become' });
        break;
      case 'switch-driver':
        setSwitchRoleError(null);
        setDialog('driver');
        break;
      case 'switch-passenger':
        setSwitchRoleError(null);
        setDialog('passenger');
        break;
      case 'manage-vehicles':
        dashboardRootNavigation?.navigate('ManageVehicles');
        break;
      case 'delete-account':
        openDeleteDialog();
        break;
      default:
        break;
    }
  };

  const resolveAccessory = (item: SettingsMenuItem): string | undefined => {
    if (item.id === 'language') {
      return currentLanguageLabel;
    }
    return undefined;
  };

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar style="light" />
      <SettingsProfileHeader
        user={user}
        isIdentityComplete={isIdentityComplete}
        topInset={insets.top}
        onVerifyPress={handleVerifyPress}
        onLogoutPress={() => setDialog('logout')}
      />

      <View style={styles.body}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: spacing.sm + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.menu}>
            {sections.map((section) => (
              <SettingsMenuSectionCard
                key={section.id}
                section={section}
                title={t(section.titleKey)}
                itemLabel={(item) => ({
                  title: t(item.titleKey),
                  subtitle:
                    item.action === 'language'
                      ? currentLanguageLabel
                      : t(item.subtitleKey),
                })}
                resolveAccessory={resolveAccessory}
                onPressItem={handleMenuPress}
              />
            ))}
          </View>

          <View style={styles.footer}>
            <AppText style={styles.versionLabel}>
              {t('profile.versionLabel')} {APP_VERSION}
            </AppText>
          </View>
        </ScrollView>
      </View>

      {legal.legalSheets}

      <LanguageSwitcherModal
        visible={languageModalVisible}
        currentLanguage={currentLanguage}
        options={languageOptions}
        onClose={() => setLanguageModalVisible(false)}
        onSelectLanguage={handleSelectLanguage}
      />

      <AppDialog
        visible={dialog === 'passenger'}
        icon="user"
        title={t('profile.account.switchPassenger.title')}
        message={
          switchRoleError ?? t('profile.account.switchPassenger.confirm')
        }
        cancelAction={{
          label: t('common.cancel'),
          onPress: closeRoleDialog,
        }}
        confirmAction={{
          label: t('profile.account.switchPassenger.confirmCta'),
          onPress: handleSwitchToPassenger,
        }}
      />

      <AppDialog
        visible={dialog === 'driver'}
        icon="car"
        title={t('profile.account.switchDriver.title')}
        message={switchRoleError ?? t('profile.account.switchDriver.confirm')}
        cancelAction={{
          label: t('common.cancel'),
          onPress: closeRoleDialog,
        }}
        confirmAction={{
          label: t('profile.account.switchDriver.confirmCta'),
          onPress: handleSwitchToDriver,
        }}
      />

      <AppDialog
        visible={dialog === 'logout'}
        icon="sign-out"
        title={t('profile.logout.title')}
        message={t('profile.logout.confirm')}
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => setDialog(null),
        }}
        confirmAction={{
          label: t('profile.logout.title'),
          onPress: handleLogout,
        }}
      />

      <AppDialog
        visible={dialog === 'delete-account'}
        icon="trash"
        title={t('profile.account.deleteAccount.title')}
        message={deleteDialogMessage}
        cancelAction={{
          label: t('common.cancel'),
          onPress: closeDeleteDialog,
        }}
        confirmAction={{
          label: t('profile.account.deleteAccount.confirmCta'),
          onPress: handleDeleteAccount,
          disabled:
            deletingAccount ||
            !deleteEligibility.canDelete ||
            deleteEligibility.status !== 'ready',
          loading: deletingAccount,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.subtle,
  },
  body: {
    flex: 1,
    marginTop: -18,
    backgroundColor: colors.background.subtle,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm + 8,
  },
  menu: {
    gap: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: spacing.lg,
  },
  versionLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
});
