import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { formatLatinNumber } from '@/shared/utils/latin-digits';
import { colors, radius, spacing } from '@/theme';

type HomeHeaderProps = {
  firstName: string;
  roleLabel: string;
  avatarUri?: string;
  credits: number;
  notificationCount: number;
  hasUnreadMessages?: boolean;
  /** `onBrand` = primary header so it blends with the passenger search form. */
  variant?: 'default' | 'onBrand';
  onChatPress?: () => void;
  onNotificationsPress?: () => void;
  onCreditsPress?: () => void;
  onProfilePress?: () => void;
};

export function HomeHeader({
  firstName,
  roleLabel,
  avatarUri,
  credits,
  notificationCount,
  hasUnreadMessages = false,
  variant = 'default',
  onChatPress,
  onNotificationsPress,
  onCreditsPress,
  onProfilePress,
}: HomeHeaderProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const creditsDisplay = formatLatinNumber(credits);
  const onBrand = variant === 'onBrand';
  const iconColor = onBrand ? colors.white : colors.text.primary;
  const helloColor = onBrand ? colors.white : colors.text.primary;
  const roleColor = onBrand ? colors.text.onBrandMuted : colors.text.secondary;

  return (
    <View
      style={[
        styles.root,
        onBrand && styles.rootOnBrand,
        { paddingTop: insets.top + spacing.xs },
      ]}
    >
      <View style={styles.profile}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.home.profileA11y')}
          onPress={onProfilePress}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarFallback,
                onBrand && styles.avatarFallbackOnBrand,
              ]}
            >
              <AppText
                weight="bold"
                style={[styles.avatarInitial, onBrand && styles.avatarInitialOnBrand]}
              >
                {firstName.charAt(0).toUpperCase()}
              </AppText>
            </View>
          )}
        </Pressable>
        <View style={styles.greeting}>
          <AppText weight="bold" style={[styles.hello, { color: helloColor }]} numberOfLines={1}>
            {t('dashboard.home.hello', { name: firstName })}
          </AppText>
          <AppText style={[styles.role, { color: roleColor }]} numberOfLines={1}>
            {roleLabel}
          </AppText>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.home.chatA11y')}
          onPress={onChatPress}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Ionicons name="chatbubble-outline" size={20} color={iconColor} />
          {hasUnreadMessages ? (
            <View style={[styles.dot, onBrand && styles.dotOnBrand]} />
          ) : null}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.home.notificationsA11y')}
          onPress={onNotificationsPress}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Ionicons name="notifications-outline" size={20} color={iconColor} />
          {notificationCount > 0 ? (
            <View style={[styles.badge, onBrand && styles.badgeOnBrand]}>
              <AppText
                weight="bold"
                style={[styles.badgeText, onBrand && styles.badgeTextOnBrand]}
              >
                {notificationCount > 9 ? '9+' : String(notificationCount)}
              </AppText>
            </View>
          ) : null}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.home.creditsA11y', { count: creditsDisplay })}
          onPress={onCreditsPress}
          style={({ pressed }) => [styles.creditsPill, pressed && styles.pressed]}
        >
          <FontAwesome5 name="coins" size={14} color={colors.accent.coins} solid />
          <View>
            <AppText weight="bold" style={styles.creditsValue}>
              {creditsDisplay}
            </AppText>
            <AppText style={styles.creditsLabel}>{t('dashboard.home.credits')}</AppText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  rootOnBrand: {
    backgroundColor: colors.primary,
  },
  profile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.background.subtle,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  avatarFallbackOnBrand: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  avatarInitial: {
    fontSize: 15,
    color: colors.primary,
  },
  avatarInitialOnBrand: {
    color: colors.white,
  },
  greeting: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  hello: {
    fontSize: 15,
  },
  role: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  dotOnBrand: {
    backgroundColor: '#FEC84B',
    borderColor: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOnBrand: {
    backgroundColor: colors.white,
  },
  badgeText: {
    fontSize: 9,
    color: colors.white,
    lineHeight: 11,
  },
  badgeTextOnBrand: {
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
    marginLeft: spacing.xxs,
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
    opacity: 0.8,
  },
});
