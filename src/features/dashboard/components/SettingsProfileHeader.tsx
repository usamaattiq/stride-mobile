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
  topInset: number;
  onEditPhoto?: () => void;
};

function roleLabelKey(role: AppRole): string {
  return role === 'driver' ? 'profile.roles.driver' : 'profile.roles.passenger';
}

export function SettingsProfileHeader({
  user,
  topInset,
  onEditPhoto,
}: SettingsProfileHeaderProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <View style={[styles.header, { paddingTop: topInset + spacing.xl }]}>
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
          <Pressable
            style={styles.editButton}
            accessibilityRole="button"
            accessibilityLabel={t('profile.photo.editAccessibility')}
            onPress={onEditPhoto}
            hitSlop={8}
          >
            <FontAwesome name="pencil" size={11} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.copy}>
          <View style={styles.nameRow}>
            <AppText weight="bold" style={styles.name} numberOfLines={1}>
              {user.fullName}
            </AppText>
            {user.isVerified ? (
              <FontAwesome name="check-circle" size={16} color={colors.white} />
            ) : null}
          </View>
          <AppText style={styles.role}>{t(roleLabelKey(user.role))}</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + spacing.md,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.primarySoft,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 28,
    color: colors.primary,
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryPressed,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    flexShrink: 1,
    fontSize: 22,
    color: colors.white,
    lineHeight: 28,
  },
  role: {
    fontSize: 15,
    color: colors.text.inverseMuted,
    lineHeight: 20,
  },
});
