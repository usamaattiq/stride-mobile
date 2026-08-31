import React from 'react';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { openWhatsAppChat } from '@/shared/utils/open-whatsapp';
import { colors, radius, spacing } from '@/theme';

export type WhatsAppContactCardProps = {
  /** e.g. "Passenger contact" / "Driver contact" */
  title: string;
  /** Header icon — defaults to user. */
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  name: string | null;
  /** Profile photo when available. */
  avatarUrl?: string | null;
  /** When set, WhatsApp is shown. Omit until contact exchange (confirm). */
  phone?: string | null;
  /** Prefill text for WhatsApp. */
  message: string;
  /** Opens this user's profile (admin listing detail). */
  onProfilePress?: () => void;
};

const WHATSAPP_GREEN = '#25D366';

function displayInitial(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) {
    return '?';
  }
  return trimmed.charAt(0).toUpperCase();
}

export function WhatsAppContactCard({
  title,
  icon = 'user',
  name,
  avatarUrl,
  phone,
  message,
  onMessagePress,
  onProfilePress,
}: WhatsAppContactCardProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const phoneValue = phone?.trim() || null;
  const showWhatsApp = Boolean(phoneValue);
  const displayName = name?.trim() || null;
  const initial = displayInitial(displayName);
  const avatarUri = avatarUrl?.trim() || null;

  const openChat = () => {
    if (!phoneValue) {
      return;
    }
    void openWhatsAppChat(phoneValue, message).catch(() => undefined);
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <FontAwesome name={icon} size={14} color={colors.primary} />
        <AppText weight="bold" style={styles.title}>
          {title}
        </AppText>
      </View>

      <Pressable
        onPress={onProfilePress}
        disabled={!onProfilePress}
        style={({ pressed }) => [styles.identity, pressed && onProfilePress && styles.identityPressed]}
        accessibilityRole={onProfilePress ? 'button' : undefined}
      >
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatarImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.avatar}>
            <AppText weight="bold" style={styles.avatarInitial}>
              {initial}
            </AppText>
          </View>
        )}
        <View style={styles.copy}>
          <AppText weight="semibold" style={styles.name} numberOfLines={1}>
            {displayName ?? t('dashboard.listings.detail.contact.fallbackName')}
          </AppText>
          <AppText style={styles.hint} numberOfLines={1}>
            {showWhatsApp
              ? t('dashboard.listings.detail.contact.whatsappHint')
              : t('dashboard.listings.detail.contact.chatHint')}
          </AppText>
        </View>
      </Pressable>

      {onMessagePress ? (
        <Pressable
          onPress={onMessagePress}
          style={styles.messageButton}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.listings.detail.contact.messageA11y')}
        >
          <FontAwesome name="comment" size={16} color={colors.white} />
          <AppText weight="semibold" style={styles.messageLabel} numberOfLines={1}>
            {t('dashboard.listings.detail.contact.message')}
          </AppText>
        </Pressable>
      ) : null}

      {showWhatsApp ? (
        <Pressable
          onPress={openChat}
          style={styles.whatsappButton}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.listings.detail.contact.whatsappA11y', {
            phone: phoneValue,
          })}
        >
          <FontAwesome5 name="whatsapp" size={18} color={colors.white} brand />
          <AppText weight="semibold" style={styles.whatsappLabel} numberOfLines={1}>
            {phoneValue}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: 15,
    color: colors.text.primary,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  identityPressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  avatarInitial: {
    fontSize: 15,
    color: colors.primary,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 14,
    color: colors.text.primary,
  },
  hint: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  messageLabel: {
    flexShrink: 1,
    fontSize: 14,
    color: colors.white,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: WHATSAPP_GREEN,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  whatsappLabel: {
    flexShrink: 1,
    fontSize: 14,
    color: colors.white,
  },
});
