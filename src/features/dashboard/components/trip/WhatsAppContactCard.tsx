import React from 'react';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
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
  phone: string;
  /** Prefill text for WhatsApp. */
  message: string;
};

const WHATSAPP_GREEN = '#25D366';

export function WhatsAppContactCard({
  title,
  icon = 'user',
  name,
  phone,
  message,
}: WhatsAppContactCardProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  const openChat = () => {
    void openWhatsAppChat(phone, message).catch(() => undefined);
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <FontAwesome name={icon} size={14} color={colors.primary} />
        <AppText weight="bold" style={styles.title}>
          {title}
        </AppText>
      </View>

      <View style={styles.identity}>
        <View style={styles.avatar}>
          <FontAwesome name="user" size={16} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          {name ? (
            <AppText weight="semibold" style={styles.name} numberOfLines={1}>
              {name}
            </AppText>
          ) : (
            <AppText weight="semibold" style={styles.name} numberOfLines={1}>
              {t('dashboard.listings.detail.contact.fallbackName')}
            </AppText>
          )}
          <AppText style={styles.hint} numberOfLines={1}>
            {t('dashboard.listings.detail.contact.whatsappHint')}
          </AppText>
        </View>
      </View>

      <Pressable
        onPress={openChat}
        style={styles.whatsappButton}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.listings.detail.contact.whatsappA11y', { phone })}
      >
        <FontAwesome5 name="whatsapp" size={18} color={colors.white} brand />
        <AppText weight="semibold" style={styles.whatsappLabel} numberOfLines={1}>
          {phone}
        </AppText>
      </Pressable>
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
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
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
