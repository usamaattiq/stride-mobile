import React from 'react';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { formatLatinNumber } from '@/shared/utils/latin-digits';
import { colors, radius, spacing } from '@/theme';

type AdminUserProfileHeaderProps = {
  fullName: string;
  avatarUrl?: string | null;
  role: 'passenger' | 'driver';
  credits: number;
  isFullyVerified: boolean;
  topInset: number;
  onBack: () => void;
};

function initialsForName(fullName: string): string {
  return fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function AdminUserProfileHeader({
  fullName,
  avatarUrl,
  role,
  credits,
  isFullyVerified,
  topInset,
  onBack,
}: AdminUserProfileHeaderProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const roleLabel = role === 'driver' ? t('admin.trips.driver') : t('admin.trips.passenger');
  const creditsDisplay = formatLatinNumber(credits);
  const avatarUri = avatarUrl?.trim() || null;

  return (
    <View style={[styles.header, { paddingTop: topInset + spacing.sm }]}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
      >
        <FontAwesome name="chevron-left" size={16} color={colors.white} />
      </Pressable>

      <View style={styles.mainRow}>
        <View style={styles.avatarWrap}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <AppText weight="bold" style={styles.avatarInitial}>
                {initialsForName(fullName)}
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.copy}>
          <View style={styles.nameRow}>
            <AppText weight="bold" style={styles.name} numberOfLines={1}>
              {fullName}
            </AppText>
            {isFullyVerified ? (
              <View style={styles.verifiedBadge} accessibilityLabel={t('admin.users.verified')}>
                <FontAwesome name="check" size={8} color={colors.white} />
              </View>
            ) : null}
          </View>
          <AppText style={styles.role}>{roleLabel}</AppText>
          {!isFullyVerified ? (
            <View style={styles.unverifiedBadge}>
              <FontAwesome name="exclamation-circle" size={11} color={colors.primary} />
              <AppText weight="semibold" style={styles.unverifiedLabel}>
                {t('admin.users.notVerified')}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.creditsPill}>
          <FontAwesome5 name="coins" size={12} color={colors.accent.coins} solid />
          <View>
            <AppText weight="bold" style={styles.creditsValue}>
              {creditsDisplay}
            </AppText>
            <AppText style={styles.creditsLabel}>{t('dashboard.home.credits')}</AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
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
    overflow: 'hidden',
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
    marginTop: 2,
  },
  unverifiedBadge: {
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
  unverifiedLabel: {
    fontSize: 11,
    color: colors.primary,
  },
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.accent.credits,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    flexShrink: 0,
  },
  creditsValue: {
    fontSize: 12,
    color: colors.white,
    lineHeight: 14,
  },
  creditsLabel: {
    fontSize: 9,
    color: colors.text.inverseMuted,
    lineHeight: 11,
  },
  pressed: {
    opacity: 0.85,
  },
});
