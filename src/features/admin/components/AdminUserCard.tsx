import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import type { AdminUserSummary } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';
import { cardBackShadow } from '@/theme/cardShadow';
import type { IdentityDocumentStatus } from '@/services/api/adminApi';

type AdminUserCardProps = {
  user: AdminUserSummary;
  onPress: () => void;
};

function docBadgeStyle(status: IdentityDocumentStatus) {
  if (status === 'approved') {
    return { badge: styles.badgeGreen, text: styles.badgeTextGreen, icon: 'check' as const, color: colors.accent.green.text };
  }
  if (status === 'pending') {
    return { badge: styles.badgeBlue, text: styles.badgeTextBlue, icon: 'clock-o' as const, color: colors.accent.blue.text };
  }
  if (status === 'rejected') {
    return { badge: styles.badgeRed, text: styles.badgeTextRed, icon: 'times-circle' as const, color: colors.primary };
  }
  return { badge: styles.badgeAmber, text: styles.badgeTextAmber, icon: 'exclamation-circle' as const, color: colors.accent.amber.text };
}

function docStatusLabel(status: IdentityDocumentStatus, t: (key: string) => string): string {
  if (status === 'approved') return t('admin.users.verified');
  if (status === 'pending') return t('admin.users.pendingApproval');
  if (status === 'rejected') return t('admin.users.rejected');
  return t('admin.users.notVerified');
}

function initialsForName(fullName: string): string {
  return fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function AdminUserCard({ user, onPress }: AdminUserCardProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const isRtl = I18nManager.isRTL;
  const avatarUrl = user.avatarViewUrl?.trim() || null;

  return (
    <View style={styles.shadowGutter}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={user.fullName}
      >
        <LinearGradient
          colors={['#FFFFFF', '#FFFBFB', '#FFF4F2', '#FEE8E6', '#FED7D3']}
          locations={[0, 0.28, 0.52, 0.78, 1]}
          start={isRtl ? { x: 1, y: 0 } : { x: 0, y: 0 }}
          end={isRtl ? { x: 0, y: 1 } : { x: 1, y: 1 }}
          style={styles.itemInner}
        >
          <View style={styles.topRow}>
            <View style={styles.topBadges}>
              {user.role !== 'driver' || user.documents.nicSubmitted ? (
                <View
                  style={[
                    styles.badge,
                    docBadgeStyle(user.documents.nicStatus).badge,
                  ]}
                >
                  <FontAwesome
                    name={docBadgeStyle(user.documents.nicStatus).icon}
                    size={9}
                    color={docBadgeStyle(user.documents.nicStatus).color}
                  />
                  <AppText
                    weight="semibold"
                    style={[
                      styles.badgeText,
                      docBadgeStyle(user.documents.nicStatus).text,
                    ]}
                    numberOfLines={1}
                  >
                    {`${t('admin.users.nic')} · ${docStatusLabel(user.documents.nicStatus, t)}`}
                  </AppText>
                </View>
              ) : null}

              {user.role === 'driver' ? (
                <View
                  style={[
                    styles.badge,
                    docBadgeStyle(user.documents.licenseStatus).badge,
                  ]}
                >
                  <FontAwesome
                    name={docBadgeStyle(user.documents.licenseStatus).icon}
                    size={9}
                    color={docBadgeStyle(user.documents.licenseStatus).color}
                  />
                  <AppText
                    weight="semibold"
                    style={[
                      styles.badgeText,
                      docBadgeStyle(user.documents.licenseStatus).text,
                    ]}
                    numberOfLines={1}
                  >
                    {`${t('admin.users.license')} · ${docStatusLabel(user.documents.licenseStatus, t)}`}
                  </AppText>
                </View>
              ) : null}
            </View>

            <View style={styles.creditsBadge}>
              <FontAwesome name="star" size={9} color={colors.white} />
              <AppText weight="semibold" style={styles.creditsText} numberOfLines={1}>
                {t('dashboard.home.creditsA11y', { count: user.credits })}
              </AppText>
            </View>
          </View>

          <View style={styles.mainRow}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.thumbnail}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={user.id}
              />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailFallback]}>
                <AppText weight="bold" style={styles.initials}>
                  {initialsForName(user.fullName)}
                </AppText>
              </View>
            )}

            <View style={styles.body}>
              <AppText weight="bold" style={styles.name} numberOfLines={1}>
                {user.fullName}
              </AppText>
              <View style={styles.metaRow}>
                <FontAwesome name="phone" size={11} color={colors.primary} />
                <AppText style={styles.meta} numberOfLines={1}>
                  {user.phoneE164}
                </AppText>
              </View>
              {user.email?.trim() ? (
                <View style={styles.metaRow}>
                  <FontAwesome name="envelope" size={11} color={colors.primary} />
                  <AppText style={styles.meta} numberOfLines={1}>
                    {user.email.trim()}
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowGutter: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  item: {
    borderRadius: radius.md,
    ...cardBackShadow,
  },
  pressed: {
    opacity: 0.92,
  },
  itemInner: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  topBadges: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeGreen: {
    backgroundColor: colors.accent.green.soft,
  },
  badgeBlue: {
    backgroundColor: colors.accent.blue.soft,
  },
  badgeAmber: {
    backgroundColor: colors.accent.amber.soft,
  },
  badgeRed: {
    backgroundColor: colors.primaryMuted,
  },
  badgeText: {
    flexShrink: 1,
    fontSize: 11,
  },
  badgeTextGreen: {
    color: colors.accent.green.text,
  },
  badgeTextBlue: {
    color: colors.accent.blue.text,
  },
  badgeTextAmber: {
    color: colors.accent.amber.text,
  },
  badgeTextRed: {
    color: colors.primary,
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.accent.credits,
    flexShrink: 0,
  },
  creditsText: {
    fontSize: 11,
    color: colors.white,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  thumbnail: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 22,
    color: colors.primary,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 16,
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  meta: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
  },
});
