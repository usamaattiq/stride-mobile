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

type AdminUserCardProps = {
  user: AdminUserSummary;
  onPress: () => void;
};

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
              {user.role !== 'driver' || user.documents.nicVerified ? (
                <View
                  style={[
                    styles.badge,
                    user.documents.nicVerified ? styles.badgeGreen : styles.badgeAmber,
                  ]}
                >
                  <FontAwesome
                    name={user.documents.nicVerified ? 'check' : 'exclamation-circle'}
                    size={9}
                    color={
                      user.documents.nicVerified
                        ? colors.accent.green.text
                        : colors.accent.amber.text
                    }
                  />
                  <AppText
                    weight="semibold"
                    style={[
                      styles.badgeText,
                      user.documents.nicVerified ? styles.badgeTextGreen : styles.badgeTextAmber,
                    ]}
                    numberOfLines={1}
                  >
                    {`${t('admin.users.nic')} · ${
                      user.documents.nicVerified
                        ? t('admin.users.verified')
                        : t('admin.users.notVerified')
                    }`}
                  </AppText>
                </View>
              ) : null}

              {user.role === 'driver' ? (
                <View
                  style={[
                    styles.badge,
                    user.documents.licenseVerified ? styles.badgeGreen : styles.badgeAmber,
                  ]}
                >
                  <FontAwesome
                    name={user.documents.licenseVerified ? 'check' : 'exclamation-circle'}
                    size={9}
                    color={
                      user.documents.licenseVerified
                        ? colors.accent.green.text
                        : colors.accent.amber.text
                    }
                  />
                  <AppText
                    weight="semibold"
                    style={[
                      styles.badgeText,
                      user.documents.licenseVerified
                        ? styles.badgeTextGreen
                        : styles.badgeTextAmber,
                    ]}
                    numberOfLines={1}
                  >
                    {`${t('admin.users.license')} · ${
                      user.documents.licenseVerified
                        ? t('admin.users.verified')
                        : t('admin.users.notVerified')
                    }`}
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
  badgeAmber: {
    backgroundColor: colors.accent.amber.soft,
  },
  badgeText: {
    flexShrink: 1,
    fontSize: 11,
  },
  badgeTextGreen: {
    color: colors.accent.green.text,
  },
  badgeTextAmber: {
    color: colors.accent.amber.text,
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
    borderRadius: radius.sm,
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
