import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import type {
  HomeMessage,
  MessageAvatarTone,
  MessageContextKind,
} from '../types/messages.types';

type MessageCardProps = {
  message: HomeMessage;
  onPress?: (message: HomeMessage) => void;
  /** Opens the linked RFQ / auction listing (context chip). */
  onPressRequest?: (message: HomeMessage) => void;
};

const AVATAR_TONES: Record<MessageAvatarTone, string> = {
  purple: colors.accent.purple.avatar,
  green: colors.accent.green.avatar,
  pink: colors.accent.pink.avatar,
  blue: colors.accent.blue.avatar,
};

const CONTEXT_THEME: Record<
  MessageContextKind,
  {
    soft: string;
    text: string;
    icon: React.ComponentProps<typeof FontAwesome5>['name'];
  }
> = {
  rfq: {
    soft: colors.primarySoft,
    text: colors.primary,
    icon: 'bus',
  },
  auction: {
    soft: colors.accent.purple.soft,
    text: colors.accent.purple.text,
    icon: 'gavel',
  },
};

export function MessageCard({
  message,
  onPress,
  onPressRequest,
}: MessageCardProps): React.ReactElement {
  const contextTheme = CONTEXT_THEME[message.context.kind];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(message)}
      style={({ pressed }) => [styles.cardWrap, pressed && styles.pressed]}
    >
      <View style={styles.card}>
        {message.avatar.imageUri ? (
          <Image
            source={{ uri: message.avatar.imageUri }}
            style={styles.avatar}
            cachePolicy="memory-disk"
            recyclingKey={message.counterpartyId}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarFallback,
              { backgroundColor: AVATAR_TONES[message.avatar.tone] },
            ]}
          >
            <AppText weight="bold" style={styles.avatarInitial}>
              {message.avatar.initials}
            </AppText>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.headerRow}>
            <AppText weight="bold" style={styles.name} numberOfLines={1}>
              {message.senderName}
            </AppText>
            <View style={styles.meta}>
              <AppText style={styles.time}>{message.timeLabel}</AppText>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: message.unread
                      ? colors.accent.unread
                      : colors.accent.read,
                  },
                ]}
              />
            </View>
          </View>

          <AppText
            weight={message.unread ? 'medium' : 'regular'}
            style={[styles.preview, message.unread && styles.previewUnread]}
            numberOfLines={2}
          >
            {message.preview}
          </AppText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={message.context.title}
            onPress={() => onPressRequest?.(message)}
            style={({ pressed }) => [
              styles.context,
              { backgroundColor: contextTheme.soft },
              pressed && styles.contextPressed,
            ]}
          >
            <View style={styles.contextIconWrap}>
              <FontAwesome5
                name={contextTheme.icon}
                size={13}
                color={contextTheme.text}
                solid
              />
            </View>
            <View style={styles.contextCopy}>
              <AppText
                weight="semibold"
                style={[styles.contextTitle, { color: contextTheme.text }]}
                numberOfLines={1}
              >
                {message.context.title}
              </AppText>
              <AppText style={styles.contextSubtitle} numberOfLines={1}>
                {message.context.subtitle}
              </AppText>
            </View>
            <FontAwesome5 name="chevron-right" size={11} color={colors.text.tertiary} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    borderRadius: radius.md,
    shadowColor: '#B42318',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pressed: {
    opacity: 0.92,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    padding: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    color: colors.white,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  time: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
  },
  previewUnread: {
    color: colors.text.primary,
  },
  context: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  contextPressed: {
    opacity: 0.85,
  },
  contextIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  contextCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  contextTitle: {
    fontSize: 13,
  },
  contextSubtitle: {
    fontSize: 11,
    color: colors.text.secondary,
  },
});
