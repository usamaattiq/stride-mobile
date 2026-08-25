import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { adminApi, type AdminUserDetail } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { colors, spacing } from '@/theme';

import { AdminUserDetailContent } from '../components/AdminUserDetailContent';
import { AdminUserProfileHeader } from '../components/AdminUserProfileHeader';
import type { AdminRootStackParamList } from '../navigation/adminNavigationTypes';

export function AdminUserDetailScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const insets = useSafeAreaInsets();
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
      <View style={styles.root}>
        <FocusAwareStatusBar style="light" />
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.root}>
        <FocusAwareStatusBar style="light" />
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <AppText style={styles.error}>{t(errorKey ?? 'admin.users.detailFailed')}</AppText>
          <Button label={t('common.ok')} onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar style="light" />
      <AdminUserProfileHeader
        fullName={user.fullName}
        avatarUrl={user.avatarViewUrl}
        role={user.role}
        credits={user.credits}
        isFullyVerified={user.documents.fullyVerified}
        topInset={insets.top}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.body}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: spacing.xl + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AdminUserDetailContent user={user} onUserUpdated={setUser} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  body: {
    flex: 1,
    marginTop: -16,
    backgroundColor: colors.background.subtle,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.subtle,
  },
  error: {
    color: colors.primary,
    textAlign: 'center',
  },
});
