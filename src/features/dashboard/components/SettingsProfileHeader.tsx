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
  /** Shown when identity is incomplete and documents are awaiting admin review. */
  isPendingApproval?: boolean;
  topInset: number;
  /** When set, shown instead of the default passenger/driver role label. */
  roleLabel?: string;
  onVerifyPress?: () => void;
  onLogoutPress?: () => void;
};

function roleLabelKey(role: AppRole): string {
  return role === 'driver' ? 'profile.roles.driver' : 'profile.roles.passenger';
}

export function SettingsProfileHeader({
  user,
  isIdentityComplete,
  isPendingApproval = false,
  topInset,
  roleLabel,
  onVerifyPress,
  onLogoutPress,
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
          <View style={styles.nameRow}>
            <AppText weight="bold" style={styles.name} numberOfLines={1}>
              {user.fullName}
            </AppText>
            {isIdentityComplete ? (
              <View
                style={styles.verifiedBadge}
                accessibilityLabel={t('profile.verification.verified')}
              >
                <FontAwesome name="check" size={8} color={colors.white} />
              </View>
            ) : null}
          </View>
          <AppText style={styles.role}>{roleLabel ?? t(roleLabelKey(user.role))}</AppText>

          {!isIdentityComplete ? (
            <Pressable
              style={isPendingApproval ? styles.pendingButton : styles.unverifiedButton}
              accessibilityRole="button"
              accessibilityLabel={
                isPendingApproval
                  ? t('profile.verification.pendingApproval')
                  : t('profile.verification.notVerified')
              }
              onPress={onVerifyPress}
              hitSlop={8}
            >
              <FontAwesome
                name={isPendingApproval ? 'clock-o' : 'exclamation-circle'}
                size={13}
                color={isPendingApproval ? colors.accent.blue.text : colors.primary}
              />
              <AppText
                weight="semibold"
                style={isPendingApproval ? styles.pendingLabel : styles.unverifiedLabel}
              >
                {isPendingApproval
                  ? t('profile.verification.pendingApproval')
                  : t('profile.verification.notVerified')}
              </AppText>
            </Pressable>
          ) : null}
        </View>

        {onLogoutPress ? (
          <Pressable
            onPress={onLogoutPress}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('profile.logout.title')}
          >
            <FontAwesome name="sign-out" size={20} color={colors.white} />
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedBadge: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#0095F6',
    alignItems: 'center',
    justifyContent: 'center',
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
  unverifiedButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  pendingButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    backgroundColor: colors.accent.blue.soft,
  },
  unverifiedLabel: {
    fontSize: 12,
    color: colors.primary,
  },
  pendingLabel: {
    fontSize: 12,
    color: colors.accent.blue.text,
  },
  logoutButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
