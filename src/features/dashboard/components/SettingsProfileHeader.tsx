import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import type { AppRole, DashboardSessionUser } from '../context/DashboardSessionContext';

type SettingsProfileHeaderProps = {
  user: DashboardSessionUser;
  /** Driver identity is complete only when NIC + license are both done. */
  isIdentityComplete: boolean;
  topInset: number;
  onEditPhoto?: () => void;
  onLogoutPress?: () => void;
  onVerifyPress?: () => void;
};

function roleLabelKey(role: AppRole): string {
  return role === 'driver' ? 'profile.roles.driver' : 'profile.roles.passenger';
}

export function SettingsProfileHeader({
  user,
  isIdentityComplete,
  topInset,
  onLogoutPress,
  onVerifyPress,
}: SettingsProfileHeaderProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <View style={[styles.header, { paddingTop: topInset + spacing.md }]}>
      <View style={styles.mainRow}>
        <View style={styles.avatarWrap}>
          {user.avatarUri ? (
            <Image source={{ uri: user.avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <AppText weight="bold" style={styles.avatarInitial}>
                {user.fullName.charAt(0).toUpperCase()}
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.copy}>
          <AppText weight="bold" style={styles.name} numberOfLines={1}>
            {user.fullName}
          </AppText>
          <AppText style={styles.role}>{t(roleLabelKey(user.role))}</AppText>

          {isIdentityComplete ? (
            <View style={styles.verifiedRow}>
              <FontAwesome name="check-circle" size={14} color={colors.white} />
              <AppText weight="semibold" style={styles.verifiedLabel}>
                {t('profile.verification.verified')}
              </AppText>
            </View>
          ) : (
            <Pressable
              style={styles.unverifiedButton}
              accessibilityRole="button"
              accessibilityLabel={t('profile.verification.notVerified')}
              onPress={onVerifyPress}
              hitSlop={8}
            >
              <FontAwesome
                name="exclamation-circle"
                size={13}
                color={colors.white}
              />
              <AppText weight="semibold" style={styles.unverifiedLabel}>
                {t('profile.verification.notVerified')}
              </AppText>
            </Pressable>
          )}
        </View>

        {onLogoutPress ? (
          <Pressable
            style={styles.logoutButton}
            accessibilityRole="button"
            accessibilityLabel={t('profile.logout.title')}
            onPress={onLogoutPress}
            hitSlop={8}
          >
            <FontAwesome name="sign-out" size={14} color={colors.white} />
            <AppText weight="medium" style={styles.logoutLabel}>
              {t('profile.logout.title')}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.xxs,
    paddingLeft: spacing.xs,
  },
  logoutLabel: {
    fontSize: 12,
    color: colors.white,
    textAlign: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    borderWidth: 2.5,
    borderColor: colors.white,
    backgroundColor: colors.primarySoft,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 26,
    color: colors.primary,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 0,
  },
  name: {
    flexShrink: 1,
    fontSize: 20,
    color: colors.white,
    lineHeight: 24,
  },
  role: {
    fontSize: 12,
    color: colors.text.inverseMuted,
    lineHeight: 14,
  },
  verifiedRow: {
     alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
        paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  verifiedLabel: {
    fontSize: 13,
    color: colors.white,
  },
  unverifiedButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  unverifiedLabel: {
    fontSize: 12,
    color: colors.white,
  },
});
