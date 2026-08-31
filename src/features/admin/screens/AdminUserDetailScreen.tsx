import React from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { adminApi, type AdminUserDetail } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { KeyboardAwareScrollView } from '@/shared/components/KeyboardAwareScrollView';
import { usePullToRefresh } from '@/shared/hooks/usePullToRefresh';
import { colors, spacing } from '@/theme';

import { AdminUserDetailContent } from '../components/AdminUserDetailContent';
import { AdminUserProfileHeader } from '../components/AdminUserProfileHeader';
import type { AdminUsersStackParamList } from '../navigation/adminNavigationTypes';

export function AdminUserDetailScreen(): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<AdminUsersStackParamList, 'UserDetail'>>();
  const route = useRoute<RouteProp<AdminUsersStackParamList, 'UserDetail'>>();
  const [user, setUser] = React.useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorKey, setErrorKey] = React.useState<string | null>(null);
  const skipFocusReload = React.useRef(true);

  const loadUser = React.useCallback(async () => {
    setErrorKey(null);
    const detail = await adminApi.getUser(route.params.userId);
    setUser(detail);
  }, [route.params.userId]);

  React.useEffect(() => {
    let cancelled = false;
    skipFocusReload.current = true;
    setLoading(true);
    setErrorKey(null);
    void loadUser()
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
  }, [loadUser]);

  useFocusEffect(
    React.useCallback(() => {
      if (skipFocusReload.current) {
        skipFocusReload.current = false;
        return;
      }
      void loadUser().catch(() => undefined);
    }, [loadUser]),
  );

  const { refreshControlProps } = usePullToRefresh(loadUser);

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
        <KeyboardAwareScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: spacing.xl + insets.bottom },
          ]}
          refreshControl={<RefreshControl {...refreshControlProps} />}
        >
          <AdminUserDetailContent
            user={user}
            listRole={route.params.listRole ?? user.role}
            onUserUpdated={setUser}
          />
        </KeyboardAwareScrollView>
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
