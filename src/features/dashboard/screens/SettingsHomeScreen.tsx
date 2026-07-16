import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { AuthStackParamList } from '@/features/auth/navigation/types';
import { useSignupDraft } from '@/features/auth/context/SignupDraftContext';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { LanguageSwitcherModal } from '@/shared/components/language-switcher/LanguageSwitcherModal';
import { getLanguageOptions } from '@/shared/components/language-switcher/options';
import type { LanguageOption } from '@/shared/components/language-switcher/types/language-switcher.types';
import { useLegalDocumentSheets } from '@/shared/hooks/useLegalDocumentSheets';
import { colors, spacing } from '@/theme';

import { SettingsMenuSectionCard } from '../components/SettingsMenuSectionCard';
import { SettingsProfileHeader } from '../components/SettingsProfileHeader';
import {
  getSettingsSectionsForRole,
  type SettingsMenuItem,
} from '../constants/settingsMenu';
import { useDashboardSession } from '../context/DashboardSessionContext';
import type { SettingsStackParamList } from '../navigation/settingsTypes';

type DialogKind = 'driver' | 'passenger' | 'general' | 'logout' | 'photo' | null;

const APP_VERSION = '1.0.0';

export function SettingsHomeScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const insets = useSafeAreaInsets();
  const legal = useLegalDocumentSheets();
  const { currentLanguage, setLanguage } = useLanguage();
  const { user, setRole, resetSession } = useDashboardSession();
  const { resetDraft } = useSignupDraft();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const rootNavigation = navigation.getParent()?.getParent() as
    | NativeStackNavigationProp<AuthStackParamList>
    | undefined;

  const [languageModalVisible, setLanguageModalVisible] = React.useState(false);
  const [dialog, setDialog] = React.useState<DialogKind>(null);

  const languageOptions = React.useMemo(() => getLanguageOptions(t), [t]);
  const currentLanguageLabel = React.useMemo(
    () =>
      languageOptions.find((option) => option.code === currentLanguage)?.label ??
      t('language.english'),
    [currentLanguage, languageOptions, t],
  );

  const sections = React.useMemo(
    () => getSettingsSectionsForRole(user.role),
    [user.role],
  );

  const handleSelectLanguage = (code: LanguageOption['code']) => {
    void setLanguage(code);
    setLanguageModalVisible(false);
  };

  const handleLogout = () => {
    setDialog(null);
    resetDraft();
    resetSession();
    rootNavigation?.reset({ index: 0, routes: [{ name: 'Welcome' }] });
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
        setDialog('general');
        break;
      case 'become-driver':
        setDialog('driver');
        break;
      case 'switch-passenger':
        setDialog('passenger');
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
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsProfileHeader
          user={user}
          topInset={insets.top}
          onEditPhoto={() => setDialog('photo')}
        />

        <View style={styles.body}>
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

          <View style={styles.footer}>
            <Pressable
              style={styles.logoutRow}
              accessibilityRole="button"
              onPress={() => setDialog('logout')}
            >
              <FontAwesome name="sign-out" size={14} color={colors.primary} />
              <AppText style={styles.logoutLabel}>{t('profile.logout.title')}</AppText>
            </Pressable>
            <AppText style={styles.versionLabel}>
              {t('profile.versionLabel')} {APP_VERSION}
            </AppText>
          </View>
        </View>
      </ScrollView>

      {legal.legalSheets}

      <LanguageSwitcherModal
        visible={languageModalVisible}
        currentLanguage={currentLanguage}
        options={languageOptions}
        onClose={() => setLanguageModalVisible(false)}
        onSelectLanguage={handleSelectLanguage}
      />

      <AppDialog
        visible={dialog === 'driver'}
        icon="car"
        title={t('profile.account.becomeDriver.title')}
        message={t('profile.account.becomeDriver.confirm')}
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => setDialog(null),
        }}
        confirmAction={{
          label: t('profile.account.becomeDriver.confirmCta'),
          onPress: () => {
            setRole('driver');
            setDialog(null);
          },
        }}
      />

      <AppDialog
        visible={dialog === 'passenger'}
        icon="user"
        title={t('profile.account.switchPassenger.title')}
        message={t('profile.account.switchPassenger.confirm')}
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => setDialog(null),
        }}
        confirmAction={{
          label: t('profile.account.switchPassenger.confirmCta'),
          onPress: () => {
            setRole('passenger');
            setDialog(null);
          },
        }}
      />

      <AppDialog
        visible={dialog === 'general'}
        icon="id-card"
        title={t('profile.account.generalInfo.title')}
        message={t('profile.account.generalInfo.comingSoon')}
        confirmAction={{
          label: t('common.ok'),
          onPress: () => setDialog(null),
        }}
      />

      <AppDialog
        visible={dialog === 'photo'}
        icon="camera"
        title={t('profile.photo.title')}
        message={t('profile.photo.comingSoon')}
        confirmAction={{
          label: t('common.ok'),
          onPress: () => setDialog(null),
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.subtle,
  },
  scroll: {
    flex: 1,
  },
  body: {
    marginTop: -24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
    backgroundColor: colors.background.subtle,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm,
  },
  logoutLabel: {
    fontSize: 15,
    color: colors.primary,
  },
  versionLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
});
