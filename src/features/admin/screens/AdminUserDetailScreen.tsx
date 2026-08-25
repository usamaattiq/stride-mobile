import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AuthScaffold } from '@/features/auth/components/AuthScaffold';
import { OfferPhotosStrip } from '@/features/dashboard/components/trip/OfferPhotosStrip';
import { WhatsAppContactCard } from '@/features/dashboard/components/trip/WhatsAppContactCard';
import { i18n as appI18n } from '@/i18n';
import { adminApi, type AdminUserDetail } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, spacing } from '@/theme';

import type { AdminRootStackParamList } from '../navigation/adminNavigationTypes';

export function AdminUserDetailScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<AdminRootStackParamList, 'UserDetail'>>();
  const route = useRoute<RouteProp<AdminRootStackParamList, 'UserDetail'>>();
  const [user, setUser] = React.useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorKey, setErrorKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorKey(null);
    void adminApi
      .getUser(route.params.userId)
      .then((detail) => {
        if (!cancelled) {
          setUser(detail);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorKey('admin.users.detailFailed');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [route.params.userId]);

  if (loading) {
    return (
      <AuthScaffold
        onBack={() => navigation.goBack()}
        title={t('admin.users.title')}
        compactHeader
        manualTopInset
        showLanguageSwitcher={false}
        showLegalFooter={false}
      >
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </AuthScaffold>
    );
  }

  if (!user) {
    return (
      <AuthScaffold
        onBack={() => navigation.goBack()}
        title={t('admin.users.title')}
        compactHeader
        manualTopInset
        showLanguageSwitcher={false}
        showLegalFooter={false}
      >
        <View style={styles.centered}>
          <AppText style={styles.error}>{t(errorKey ?? 'admin.users.detailFailed')}</AppText>
          <Button label={t('common.ok')} onPress={() => navigation.goBack()} />
        </View>
      </AuthScaffold>
    );
  }

  const nicPhotos = [user.nicFrontViewUrl, user.nicBackViewUrl].filter(
    (url): url is string => Boolean(url),
  );
  const licensePhotos = [user.driverLicenseFrontViewUrl, user.driverLicenseBackViewUrl].filter(
    (url): url is string => Boolean(url),
  );

  return (
    <AuthScaffold
      onBack={() => navigation.goBack()}
      title={user.fullName}
      subtitle={user.role === 'driver' ? t('admin.users.drivers') : t('admin.users.passengers')}
      compactHeader
      manualTopInset
      showLanguageSwitcher={false}
      showLegalFooter={false}
    >
      <View style={styles.content}>
        <WhatsAppContactCard
          title={
            user.role === 'driver'
              ? t('admin.users.driverContact')
              : t('admin.users.passengerContact')
          }
          icon={user.role === 'driver' ? 'car' : 'user'}
          name={user.fullName}
          phone={user.phoneE164}
          message={t('admin.users.whatsappMessage', { name: user.fullName })}
        />

        <AppText style={styles.meta}>{user.email ?? t('admin.users.noEmail')}</AppText>
        <AppText style={styles.meta}>{user.address ?? t('admin.users.noAddress')}</AppText>
        <AppText style={styles.meta}>
          {t('admin.users.roleCredits', {
            role: user.role,
            credits: user.credits,
            status: user.status,
          })}
        </AppText>
        <AppText style={styles.meta}>
          {user.documents.nicVerified
            ? t('admin.users.verified')
            : t('admin.users.notVerified')}
          {user.nicNumber ? ` · ${t('admin.users.nic')} ${user.nicNumber}` : ''}
        </AppText>

        <OfferPhotosStrip
          label={t('admin.users.nic')}
          photos={
            nicPhotos.length
              ? { photoUrls: nicPhotos, photoDisplayUris: nicPhotos }
              : null
          }
        />

        {user.role === 'driver' ? (
          <>
            <AppText style={styles.meta}>
              {user.documents.licenseVerified
                ? t('admin.users.verified')
                : t('admin.users.notVerified')}
              {user.driverLicenseNumber
                ? ` · ${t('admin.users.license')} ${user.driverLicenseNumber}`
                : ''}
            </AppText>
            <OfferPhotosStrip
              label={t('admin.users.license')}
              photos={
                licensePhotos.length
                  ? { photoUrls: licensePhotos, photoDisplayUris: licensePhotos }
                  : null
              }
            />
          </>
        ) : null}
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  meta: {
    color: colors.text.secondary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  error: {
    color: colors.primary,
    textAlign: 'center',
  },
});
