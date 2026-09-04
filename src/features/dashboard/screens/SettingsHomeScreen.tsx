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
import { resetToWelcome } from '@/navigation/navigationRef';
import { adminApi } from '@/services/api/adminApi';
import { ApiError } from '@/services/api/apiError';
import { authApi } from '@/services/api/authApi';
import type {
  AccountDeletionActivity,
  AccountDeletionBlockReason,
} from '@/services/api/authApi.types';
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
import { adminStore, useAdminStore } from '@/store/adminStore';
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
  activities: AccountDeletionActivity[];
};

const INITIAL_DELETE_ELIGIBILITY: DeleteEligibilityState = {
  status: 'idle',
  canDelete: false,
  reasons: [],
  activities: [],
};

type DeleteBlockRow = {
  key: string;
  heading?: string;
  text: string;
};

function parseDeletionActivities(raw: unknown): AccountDeletionActivity[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }
    const row = item as Partial<AccountDeletionActivity>;
    if (
      (row.kind !== 'trip' && row.kind !== 'offer' && row.kind !== 'bid') ||
      (row.role !== 'driver' && row.role !== 'passenger') ||
      typeof row.label !== 'string' ||
      !row.label.trim()
    ) {
      return [];
    }
    return [{ kind: row.kind, role: row.role, label: row.label.trim() }];
  });
}

function activityItemLabel(
  activity: AccountDeletionActivity,
  t: (key: string, options?: Record<string, string>) => string,
): string {
  const key =
    activity.kind === 'trip'
      ? 'profile.account.deleteAccount.blockedTripItem'
      : activity.kind === 'offer'
        ? 'profile.account.deleteAccount.blockedOfferItem'
        : 'profile.account.deleteAccount.blockedBidItem';
  return t(key, { route: activity.label });
}

function deletionBlockRows(
  reasons: AccountDeletionBlockReason[],
  activities: AccountDeletionActivity[],
  t: (key: string, options?: Record<string, string>) => string,
): DeleteBlockRow[] {
  if (activities.length > 0) {
    const rows: DeleteBlockRow[] = [];
    (['driver', 'passenger'] as const).forEach((role) => {
      const group = activities.filter((activity) => activity.role === role);
      if (group.length === 0) {
        return;
      }
      const heading =
        role === 'driver'
          ? t('profile.account.deleteAccount.blockedAsDriver')
          : t('profile.account.deleteAccount.blockedAsPassenger');
      group.forEach((activity, index) => {
        rows.push({
          key: `${role}-${activity.kind}-${activity.label}-${index}`,
          heading: index === 0 ? heading : undefined,
          text: activityItemLabel(activity, t),
        });
      });
    });
    return rows;
  }

  const items: string[] = [];
  const hasCombinedSender = reasons.includes('active_offer_or_bid');
  if (reasons.includes('owner_open_listing')) {
    items.push(t('profile.account.deleteAccount.blockedTrips'));
  }
  if (reasons.includes('active_offer') || hasCombinedSender) {
    items.push(t('profile.account.deleteAccount.blockedOffers'));
  }
  if (reasons.includes('active_bid') || hasCombinedSender) {
    items.push(t('profile.account.deleteAccount.blockedBids'));
  }
  if (items.length === 0 && reasons.length > 0) {
    items.push(t('profile.account.deleteAccount.blockedGeneric'));
  }
  return items.map((text, index) => ({ key: `fallback-${index}`, text }));
}

type SettingsNav = CompositeNavigationProp<
  NativeStackNavigationProp<SettingsStackParamList>,
  BottomTabNavigationProp<DashboardTabParamList>
>;

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.8';

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
  const profile = useProfileStore((state) => state.profile);
  const { resetDraft } = useSignupDraftStore();
  const sessionKind = useAuthStore((state) => state.sessionKind);
  const adminProfile = useAdminStore((state) => state.profile);
  const isAdmin = sessionKind === 'admin';
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

  const deleteBlockRows = React.useMemo(() => {
    if (
      deleteAccountError ||
      deleteEligibility.status !== 'ready' ||
      deleteEligibility.canDelete
    ) {
      return [];
    }
    return deletionBlockRows(deleteEligibility.reasons, deleteEligibility.activities, t);
  }, [deleteAccountError, deleteEligibility, t]);

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
    return t('profile.account.deleteAccount.blockedIntro');
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
        isAdmin,
      }),
    [user.role, hasDriverVerification, isAdmin],
  );

  const displayUser = React.useMemo(() => {
    if (!isAdmin || !adminProfile) {
      return user;
    }
    return {
      ...user,
      firstName: adminProfile.fullName.split(' ')[0] ?? adminProfile.fullName,
      fullName: adminProfile.fullName,
      mobileNumber: adminProfile.phoneE164,
      isVerified: true,
    };
  }, [adminProfile, isAdmin, user]);

  const isIdentityComplete = isAdmin
    ? true
    : user.role === 'driver'
      ? user.isVerified && hasDriverVerification
      : user.isVerified;

  const isPendingApproval = React.useMemo(() => {
    if (isAdmin || isIdentityComplete || !profile) {
      return false;
    }

    const nicPending = profile.nicStatus === 'pending';
    const licensePending = profile.licenseStatus === 'pending';

    if (user.role === 'driver') {
      return nicPending || licensePending;
    }

    return nicPending;
  }, [isAdmin, isIdentityComplete, profile, user.role]);

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
      if (isAdmin) {
        await adminApi.logout().catch(() => undefined);
        adminStore.clearProfile();
      } else {
        await authApi.logout().catch(() => undefined);
      }
      await useAuthStore.getState().signOut();
      useProfileStore.getState().clearProfile();
      resetDraft();
      resetSession();
      if (authRootNavigation) {
        authRootNavigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      } else {
        resetToWelcome();
      }
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
    setDeleteEligibility({ status: 'loading', canDelete: false, reasons: [], activities: [] });
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
          activities: parseDeletionActivities(result.activities),
        });
      })
      .catch(() => {
        if (deleteEligibilityRequestId.current !== requestId) {
          return;
        }
        setDeleteEligibility({ status: 'error', canDelete: false, reasons: [], activities: [] });
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
          const details = error.details as
            | { reasons?: AccountDeletionBlockReason[]; activities?: unknown }
            | undefined;
          const reasons = Array.isArray(details?.reasons) ? details.reasons : [];
          setDeleteEligibility({
            status: 'ready',
            canDelete: false,
            reasons,
            activities: parseDeletionActivities(details?.activities),
          });
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
        if (profile?.licenseStatus === 'pending' || profile?.licenseStatus === 'approved') {
          setSwitchRoleError(null);
          setDialog('driver');
        } else if (!user.isVerified) {
          navigation.navigate('NicVerification', { continueToDriverLicense: true });
        } else {
          navigation.navigate('DriverVerification', { purpose: 'become' });
        }
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
      case 'bank-accounts':
        navigation.navigate('BankAccounts');
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
        user={displayUser}
        isIdentityComplete={isIdentityComplete}
        isPendingApproval={isPendingApproval}
        roleLabel={isAdmin ? t('admin.settings.role') : undefined}
        topInset={insets.top}
        onVerifyPress={isAdmin ? undefined : handleVerifyPress}
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
      >
        {deleteBlockRows.length > 0 ? (
          <ScrollView
            style={styles.deleteBlockScroll}
            contentContainerStyle={styles.deleteBlockList}
            nestedScrollEnabled
          >
            {deleteBlockRows.map((row) => (
              <View key={row.key} style={styles.deleteBlockGroup}>
                {row.heading ? (
                  <AppText style={styles.deleteBlockHeading}>{row.heading}</AppText>
                ) : null}
                <View style={styles.deleteBlockRow}>
                  <AppText style={styles.deleteBlockBullet}>•</AppText>
                  <AppText style={styles.deleteBlockItem}>{row.text}</AppText>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </AppDialog>
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
  deleteBlockScroll: {
    alignSelf: 'stretch',
    maxHeight: 220,
    marginTop: spacing.sm,
  },
  deleteBlockList: {
    gap: spacing.xs,
  },
  deleteBlockGroup: {
    gap: 2,
  },
  deleteBlockHeading: {
    marginTop: spacing.xs,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'left',
  },
  deleteBlockRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  deleteBlockBullet: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
  },
  deleteBlockItem: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
    textAlign: 'left',
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
